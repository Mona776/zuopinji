/**
 * AudioManager.js (v5 - 干净版)
 * 完全移除所有持续振荡器，只使用playTone播放音符
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.battleBGMGain = null;
        this.enabled = false;
        this.currentBgmKey = null;
        this.bgmInterval = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.masterGain);
        this.bgmGain.gain.value = 0.4;
        
        this.battleBGMGain = this.ctx.createGain();
        this.battleBGMGain.connect(this.bgmGain);
        this.battleBGMGain.gain.value = 0.6;

        this.enabled = true;
        console.log("音频系统 v5 已激活 (干净版)");
    }

    startBGM(key) {
        if (!this.enabled) {
            this.init();
        }
        if (!this.enabled) return;
        if (this.currentBgmKey === key) return;
        
        this.stopBGM();
        this.currentBgmKey = key;

        let beat = 0;
        const bpm = key === 'battle' ? 170 : 75;
        const interval = (60 / bpm) * 1000 / 2;

        console.log(`[BGM] 开始播放 ${key} BGM`);

        this.bgmInterval = setInterval(() => {
            if (!this.enabled) return;
            if (key === 'battle') this.playBattleStep(beat);
            else if (key === 'shop') this.playShopStep(beat);
            beat++;
        }, interval);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.currentBgmKey = null;
        console.log('[BGM] BGM已停止');
    }

    // ========== 战斗BGM ==========
    playBattleStep(beat) {
        const cycleLength = 64;
        const bar = beat % cycleLength;
        const section = Math.floor(bar / 16);
        
        // 贝斯线
        const bassLines = [
            [82, 98, 110, 82, 82, 123, 110, 98, 82, 98, 110, 82, 82, 131, 110, 98],
            [98, 110, 123, 98, 98, 131, 123, 110, 98, 110, 123, 98, 98, 147, 123, 110],
            [110, 123, 131, 110, 110, 147, 131, 123, 110, 123, 131, 110, 110, 165, 131, 123],
            [82, 98, 110, 82, 98, 123, 110, 98, 82, 98, 110, 98, 82, 131, 110, 98]
        ];
        const bassFreq = bassLines[section][bar % 16];
        
        // 贝斯
        if (beat % 4 === 0 || beat % 4 === 2) {
            this.playBGMTone(bassFreq, 'triangle', 0.15, 0.1);
            this.playBGMTone(bassFreq * 0.5, 'triangle', 0.12, 0.05);
        }

        // 主旋律
        const melodies = [
            [523, 0, 659, 0, 784, 0, 659, 0, 523, 0, 0, 0, 659, 0, 784, 0],
            [587, 0, 698, 0, 880, 0, 698, 0, 587, 0, 0, 0, 698, 0, 880, 0],
            [659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 0, 0, 784, 0, 880, 0],
            [784, 0, 880, 0, 1047, 0, 880, 0, 784, 0, 659, 0, 523, 0, 659, 0]
        ];
        const note = melodies[section][bar % 16];
        
        if (note > 0) {
            this.playBGMTone(note, 'triangle', 0.15, 0.08);
            this.playBGMTone(note * 2, 'sine', 0.1, 0.04);
        }

        // 鼓组
        if (beat % 4 === 0) {
            this.playBGMTone(60, 'square', 0.1, 0.15, 30);
            this.playBGMTone(90, 'triangle', 0.06, 0.1);
        }
        if (beat % 4 === 2) {
            this.playBGMTone(180, 'triangle', 0.08, 0.12);
            this.playBGMTone(350, 'square', 0.04, 0.08);
        }

        // 反拍和弦
        if (beat % 2 === 1) {
            const chords = [
                [330, 392, 494],
                [349, 415, 494],
                [392, 466, 554],
                [330, 392, 494]
            ];
            chords[section].forEach((f, i) => {
                setTimeout(() => {
                    this.playBGMTone(f, 'sawtooth', 0.06, 0.04);
                }, i * 5);
            });
        }
    }

    // ========== 商店BGM ==========
    playShopStep(beat) {
        const bar = beat % 8;
        const bassNotes = [110, 138, 165, 138, 110, 146, 165, 196];
        
        if (beat % 2 === 0) {
            this.playBGMTone(bassNotes[bar], 'triangle', 0.5, 0.1, bassNotes[bar] * 0.9, false);
            const chords = [[220, 277, 330], [246, 311, 370], [262, 330, 392], [220, 277, 330]];
            chords[Math.floor(bar / 2) % 4].forEach(freq => {
                this.playBGMTone(freq, 'sine', 0.6, 0.05, 0, false);
            });
        }
        if (beat % 2 === 1) {
            this.playBGMTone(2000, 'sine', 0.02, 0.06, 0, false);
        }
    }

    // ========== 音效播放 ==========
    playTone(freq, type, duration, volume, slideTo = 0) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playBGMTone(freq, type, duration, volume, slideTo = 0, isBattle = true) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(isBattle ? this.battleBGMGain : this.bgmGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // ========== UI音效 ==========
    playHover() { /* 已移除悬停音效 */ }
    playSelect() { 
        this.playTone(150, 'triangle', 0.1, 0.2, 50);
        this.playTone(1200, 'sine', 0.05, 0.1);
    }
    playEquip() {
        this.playTone(100, 'square', 0.2, 0.15, 40);
        setTimeout(() => this.playTone(80, 'square', 0.1, 0.1), 50);
    }
    playReroll() {
        for(let i = 0; i < 5; i++) setTimeout(() => this.playTone(400 + Math.random() * 600, 'sawtooth', 0.05, 0.05), i * 40);
    }
    playSpawn(size = 'small') {
        if (size === 'small') this.playTone(200, 'sine', 0.1, 0.2, 800);
        else this.playTone(150, 'triangle', 0.3, 0.3, 40);
    }
    playAttack(type = 'normal') {
        if (type === 'heavy') {
            this.playTone(90, 'sine', 0.12, 0.12, 50);
            this.playTone(280, 'sine', 0.06, 0.06);
        } else {
            this.playTone(320, 'sine', 0.04, 0.08, 200);
        }
    }
    playKnockback() { this.playTone(180, 'sine', 0.2, 0.08, 400); }
    playAlarm() {
        this.playTone(440, 'sine', 0.5, 0.1, 880);
        setTimeout(() => this.playTone(880, 'sine', 0.5, 0.1, 440), 500);
    }

    // ========== 基地破碎音效 ==========
    playBaseBreak() {
        if (!this.enabled) this.init();
        const now = this.ctx.currentTime;
        
        // 1. 破碎声 (Crunchy Noise)
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);

        // 2. 低频冲击 (Low Impact)
        this.playTone(80, 'square', 0.4, 0.2, 40);
        
        // 3. 金属碎片声 (High Tinks)
        [1200, 1500, 1800].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.1, 0.05), i * 50);
        });
    }

    // ========== 胜利音乐 (RPG Victory Jingle) ==========
    playVictory() {
        console.log("[DEBUG] playVictory called");
        if (!this.enabled) {
            console.log("[DEBUG] AudioManager not enabled, initializing...");
            this.init();
        }
        this.stopBGM(); // 停止当前背景音乐

        const now = this.ctx.currentTime;
        
        // 1. Orchestral Hit + Sawtooth Synth Chord (C Major 7th)
        // C4, E4, G4, B4
        const chord = [261.63, 329.63, 392.00, 493.88];
        chord.forEach(freq => {
            // Sawtooth layer for "heroic" feel
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0.15, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.5);

            // Sine layer for "punchy" body
            const osc2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq, now);
            g2.gain.setValueAtTime(0.1, now);
            g2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc2.connect(g2);
            g2.connect(this.masterGain);
            osc2.start(now);
            osc2.stop(now + 0.5);
        });

        // 2. Crystal Arpeggio (Rapid ascending)
        const arpNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5 to C7
        arpNotes.forEach((freq, i) => {
            const startTime = now + 0.1 + (i * 0.06);
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            g.gain.setValueAtTime(0.1, startTime);
            g.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });

        // 3. Final Shimmering Note (C7) with long tail
        const finalFreq = 2093.00;
        const finalOsc = this.ctx.createOscillator();
        const finalGain = this.ctx.createGain();
        finalOsc.type = 'triangle';
        finalOsc.frequency.setValueAtTime(finalFreq, now + 0.6);
        finalGain.gain.setValueAtTime(0.08, now + 0.6);
        finalGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0); // Long fade out
        finalOsc.connect(finalGain);
        finalGain.connect(this.masterGain);
        finalOsc.start(now + 0.6);
        finalOsc.stop(now + 3.0);
    }

    // ========== 失败音乐 (System Crash / Game Over) ==========
    playDefeat() {
        if (!this.enabled) {
            this.init();
        }
        this.stopBGM();

        const now = this.ctx.currentTime;

        // 1. Impact Thud (Deep & Bass-heavy)
        const impactFreq = 60;
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = 'square'; // More grit than sine
        osc1.frequency.setValueAtTime(impactFreq, now);
        g1.gain.setValueAtTime(0.3, now);
        g1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc1.connect(g1);
        g1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // 2. Power Down (Pitch sliding downwards)
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(440, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 1.2);
        g2.gain.setValueAtTime(0.15, now + 0.1);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc2.connect(g2);
        g2.connect(this.masterGain);
        osc2.start(now + 0.1);
        osc2.stop(now + 1.2);

        // 3. Digital Glitch / Static (Noise layer)
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.05, now + 0.8);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now + 0.8);
        noise.stop(now + 1.5);
    }
}

window.audioManager = new AudioManager();
