// --- KAWAII NEON AUDIO ENGINE ---
class AudioEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // A cute "Sparkle Tick" for the reel spin
    playTick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; // Softer wave
        osc.frequency.setValueAtTime(880, this.ctx.currentTime); // High pitch A5
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // A bouncy "Bubble Pop" when a reel stops
    playStopThud() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15); // Upward 'pop'
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // HIGH-FIDELITY BIOLOGICAL "MEOW" SYNTHESIS
    _createMeow(start, duration, isHappy = true) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator(); // Purr/Vibrato
        const modGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const baseFreq = isHappy ? 660 : 330;
        osc.frequency.setValueAtTime(baseFreq, start);
        if (isHappy) {
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, start + 0.1);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, start + duration);
        } else {
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, start + duration);
        }

        mod.type = 'sine'; mod.frequency.value = 15; modGain.gain.value = 15;
        mod.connect(modGain); modGain.connect(osc.frequency);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isHappy ? 2200 : 1200, start);
        filter.frequency.exponentialRampToValueAtTime(isHappy ? 3800 : 800, start + duration);
        filter.Q.value = 8; 

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.05); // Increased volume
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        mod.start(start); osc.start(start);
        mod.stop(start + duration); osc.stop(start + duration);
    }

    // Triumphant Happy Meow (Mew-Mew-Mew)
    playJackpot() {
        const now = this.ctx.currentTime;
        [0, 0.2, 0.4].forEach(d => this._createMeow(now + d, 0.18, true));
    }

    // EXTENDED HAPPY CAT MELODY
    playJackpotMusic() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const melody = [523, 659, 783, 1046, 783, 1318, 1046, 1568]; 
        melody.forEach((f, i) => {
            const start = now + (i * 0.18);
            this._createMeow(start, 0.2, true);
        });
    }

    // NEW: POWER-UP / INSERT TOKEN SOUND
    playPowerUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
    }

    // ADVANCED PROCEDURAL "CAT JAZZ" BGM
    playBGM() {
        if (!this.ctx || this.bgm) return;
        this.resume();
        this.bgm = true;
        const now = this.ctx.currentTime;
        
        this.bgmGain = this.ctx.createGain(); 
        this.bgmGain.gain.setValueAtTime(0.12, now); 
        this.bgmGain.connect(this.ctx.destination);

        // --- LONG WALKING BASS (16-BAR LOOP) ---
        const bassNotes = [
            65.41, 82.41, 98.00, 110.00, // C2
            87.31, 110.00, 130.81, 146.83, // F2
            65.41, 82.41, 130.81, 123.47, // C2
            98.00, 110.00, 123.47, 146.83, // G2
            130.81, 110.00, 98.00, 82.41,   // C2
            87.31, 103.83, 130.81, 155.56, // Fm
            65.41, 98.00, 130.81, 164.81, // C2
            98.00, 123.47, 146.83, 196.00  // G2
        ]; 
        let bassStep = 0;

        const playBass = () => {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(bassNotes[bassStep % bassNotes.length], t);
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            osc.connect(g);
            g.connect(this.bgmGain);
            osc.start(t);
            osc.stop(t + 0.45);
            bassStep++;
            setTimeout(playBass, 500); 
        };

        // --- SNAPPY MEOW IMPROVISATION (THE "CAT" IN JAZZ) ---
        const melodyScale = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25]; // C Minor Pentatonic
        const playCatMelody = () => {
            if (Math.random() > 0.4) {
                const t = this.ctx.currentTime;
                const freq = melodyScale[Math.floor(Math.random() * melodyScale.length)];
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.2); 
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000, t);
                filter.Q.value = 5;

                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.04, t + 0.05); 
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

                osc.connect(filter); filter.connect(g); g.connect(this.bgmGain);
                osc.start(t); osc.stop(t + 0.3);
            }
            setTimeout(playCatMelody, Math.random() > 0.5 ? 250 : 500);
        };

        // --- BRUSH DRUMS ---
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const playBrush = () => {
            const t = this.ctx.currentTime;
            const source = this.ctx.createBufferSource();
            const g = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            source.buffer = buffer;
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7000, t);
            g.gain.setValueAtTime(0.02, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            source.connect(filter); filter.connect(g); g.connect(this.bgmGain);
            source.start(t);
            setTimeout(playBrush, 500); 
        };

        playBass();
        playCatMelody();
        setTimeout(playBrush, 250);
    }

    // Realistic Sad Meow with BGM Ducking
    playLoseBuzz() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // DUCK BGM: Fade jazz music out momentarily
        if (this.bgmGain) {
            this.bgmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            this.bgmGain.gain.exponentialRampToValueAtTime(0.15, now + 1.2);
        }

        this._createMeow(now, 0.7, false); // Slightly longer meow
    }
}

function triggerJackpotAnimation() {
    const overlay = document.getElementById('jackpot-overlay');
    const catContainer = overlay.querySelector('.rotating-cats');
    catContainer.innerHTML = ''; 
    overlay.classList.add('active');

    const totalCats = 5;
    const catImages = Array.from({length: totalCats}, (_, i) => `https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/cat${i+1}.png`);
    
    catImages.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'celebration-cat';
        img.style.setProperty('--index', i);
        img.style.animationDelay = `${i * 0.2}s`;
        catContainer.appendChild(img);
    });

    const thanksBtn = document.getElementById('thanks-cat-btn');
    const footer = document.querySelector('footer');
    footer.classList.add('hiding'); // Controlled by CSS z-index instead of display:none to prevent jumping

    setTimeout(() => {
        const closeOverlay = () => {
            overlay.classList.remove('active');
            footer.classList.remove('hiding');
            overlay.onclick = null;
            thanksBtn.onclick = null;
        };
        overlay.onclick = closeOverlay;
        thanksBtn.onclick = closeOverlay;
    }, 2000);
}

function startGame() {
    const startOverlay = document.getElementById('start-overlay');
    Audio.init();
    Audio.playPowerUp();
    Audio.playBGM();
    startOverlay.classList.add('hidden');
    setTimeout(() => {
        startOverlay.style.display = 'none';
        init(); // Standard init after start
    }, 800);
}

const Audio = new AudioEngine();

const ASSETS_MAP = {
    SHELL_FRAME: "https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/shell.png",
    NEON_GRID: "neon_grid_placeholder.png"
};

const symbols = [
    'https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/cat1.png',
    'https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/cat2.png',
    'https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/cat3.png',
    'https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/cat4.png',
    'https://raw.githubusercontent.com/Mona776/catty/main/%E8%80%81%E8%99%8E%E6%9C%BA22/cat5.png'
];
const reelContainers = [
    document.querySelector('#reel1 .symbol-container'),
    document.querySelector('#reel2 .symbol-container'),
    document.querySelector('#reel3 .symbol-container')
];
const spinBtn = document.getElementById('spin-btn');
const statusDisplay = document.getElementById('status');
const shellOverlay = document.getElementById('machine-shell');
const slotsWrapper = document.getElementById('slots-wrapper');

// Calibration Constants
const SYMBOL_HEIGHT = 169.33; 
const ROTATIONS = 15; 
const BASE_TIMING = 2000; 
const START_OFFSET = symbols.length * 2; 

let currentResults = [0, 0, 0]; 

// --- FIXED FISHEYE ENGINE (Production Mode) ---
const LENS_CONFIG = {
    FACTOR: 9.6,
    CX: 585,
    CY: 640
};

const displaceCanvas = document.getElementById('displace-canvas');
const feMap = document.getElementById('fe-map');
const ctx = displaceCanvas.getContext('2d');

/**
 * GENERATE BARREL MAP - Mathematical implementation of the user's formula
 */
function generateDisplacementMap() {
    const width = 1200;
    const height = 1200;
    const distortionStrength = LENS_CONFIG.FACTOR;
    const cx_val = LENS_CONFIG.CX;
    const cy_val = LENS_CONFIG.CY;
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // Normalize coordinates based on current slider CX/CY
            let nx = (x - cx_val) / (width / 2);
            let ny = (y - cy_val) / (height / 2);

            // Barrel Distortion Core Math
            // Produces the exponential curvature required for bulging center
            let r2 = nx * nx + ny * ny;
            let factor = distortionStrength * r2;

            // X and Y Offset vectors
            let offsetX = nx * factor;
            let offsetY = ny * factor;

            // Map vectors into RGB [0, 255] around neutral 128
            let r = Math.min(Math.max(128 + (offsetX * 127), 0), 255);
            let g = Math.min(Math.max(128 + (offsetY * 127), 0), 255);

            data[idx] = r;      // X-Displacement Channel
            data[idx + 1] = g;  // Y-Displacement Channel
            data[idx + 2] = 0;
            data[idx + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = displaceCanvas.toDataURL("image/png");
    
    // Direct attribute assignment for SVG Image Source
    feMap.setAttribute('href', dataUrl);
    feMap.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
}

function syncLens() {
    generateDisplacementMap();
    const wrap = document.getElementById('fisheye-wrap');
    if (wrap) {
        wrap.style.display = 'none';
        void wrap.offsetHeight;
        wrap.style.display = 'flex';
    }
}

// --- SLOT CORE LOGIC ---
function init() {
    if (ASSETS_MAP.SHELL_FRAME) shellOverlay.style.backgroundImage = `url("${ASSETS_MAP.SHELL_FRAME}")`;
    syncLens();
    const neonCells = document.querySelectorAll('.neon-cell');

    // INITIAL STANDBY STATE
    if (neonCells[4]) {
        neonCells[4].classList.add('standby-emoji-active');
        const emojiSpan = neonCells[4].querySelector('.lose-emoji');
        if (emojiSpan) emojiSpan.textContent = '⌯◑ω◑⌯';
    }

    reelContainers.forEach((container, i) => {
        if (!container.classList.contains('idle-drifting')) {
            container.classList.add('idle-drifting');
        }
        for (let j = 0; j < 300; j++) {
            const sym = symbols[j % symbols.length];
            const div = document.createElement('div');
            div.className = 'symbol';
            const img = document.createElement('img');
            img.src = sym;
            img.style.width = "75%"; img.style.height = "75%"; img.style.objectFit = "contain";
            div.appendChild(img);
            container.appendChild(div);
        }
        const initialTarget = Math.floor(Math.random() * symbols.length);
        const y = - ( (START_OFFSET + initialTarget - 1) * SYMBOL_HEIGHT );
        container.style.transform = `translateY(${y}px)`;
        currentResults[i] = initialTarget;
    });
}

async function spin() {
    if (spinBtn.disabled) return;
    
    // 1. AUDIO INITIALIZATION (Browser requirement)
    Audio.init();
    Audio.resume();

    // Reset Grid States
    slotsWrapper.classList.remove('jackpot-active');
    const neonCells = document.querySelectorAll('.neon-cell');
    neonCells.forEach(cell => {
        cell.classList.remove('lose-emoji-active');
        cell.classList.remove('standby-emoji-active');
    });

    // Start Rhythmic Ticking for Spin
    const tickInterval = setInterval(() => {
        if (spinBtn.disabled) Audio.playTick();
        else clearInterval(tickInterval);
    }, 120);

    reelContainers.forEach((container, i) => {
        container.classList.remove('idle-drifting');
        const lastTarget = currentResults[i];
        const baseTranslateY = - ( (START_OFFSET + lastTarget - 1) * SYMBOL_HEIGHT );
        container.style.transition = 'none';
        container.style.transform = `translateY(${baseTranslateY}px)`;
        void container.offsetHeight; 
    });
    spinBtn.disabled = true;
    statusDisplay.textContent = 'Spinning...';
    statusDisplay.style.color = '#ffcc00';
    const nextResults = [];
    const promises = [];
    
    reelContainers.forEach((container, i) => {
        const targetIndex = Math.floor(Math.random() * symbols.length); // Normal random probability
        nextResults.push(targetIndex);
        const duration = BASE_TIMING + (i * 1000);
        const rotationsOffset = (ROTATIONS + i * 5) * symbols.length;
        const finalStripIndex = START_OFFSET + rotationsOffset + targetIndex;
        const targetTranslateY = - ( (finalStripIndex - 1) * SYMBOL_HEIGHT );
        requestAnimationFrame(() => {
            container.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.9, 0, 1)`;
            container.style.transform = `translateY(${targetTranslateY}px)`;
        });
        
        promises.push(new Promise(resolve => {
            setTimeout(() => {
                Audio.playStopThud();
                resolve();
            }, duration);
        }));
    });
    await Promise.all(promises);
    clearInterval(tickInterval); // Stop ticking
    currentResults = nextResults;
    checkWin(nextResults);
}

function checkWin(results) {
    const [r1, r2, r3] = results;
    const neonCells = document.querySelectorAll('.neon-cell');

    if (r1 === r2 && r2 === r3) {
        statusDisplay.textContent = 'JACKPOT! 🎰';
        statusDisplay.style.color = '#ffcc00';
        slotsWrapper.classList.add('jackpot-active'); 
        Audio.playJackpotMusic();
        spawnConfetti();
        triggerJackpotAnimation();
    } else {
        statusDisplay.textContent = 'Try Again';
        statusDisplay.style.color = '#ffffff';
        // Activate Failure Emoticon in center cell
        if (neonCells[4]) {
            neonCells[4].classList.add('lose-emoji-active');
            const emojiSpan = neonCells[4].querySelector('.lose-emoji');
            if (emojiSpan) emojiSpan.textContent = '^›⩊‹^';
        }
        Audio.playLoseBuzz();
    }
    spinBtn.disabled = false;
    // RE-ENTER IDLE DRIFT (After a 5-second pause to let symbols settle)
    setTimeout(() => {
        if (!spinBtn.disabled) {
            reelContainers.forEach(container => container.classList.add('idle-drifting'));
        }
    }, 5000);
}

function spawnConfetti() {
    const container = document.querySelector('.machine-container');
    for (let i = 0; i < 40; i++) {
        const c = document.createElement('div');
        c.style.position = 'absolute';
        c.style.width = '10px'; c.style.height = '10px';
        c.style.backgroundColor = `hsl(${Math.random() * 360}, 90%, 60%)`;
        c.style.left = '50%'; c.style.bottom = '15%'; c.style.zIndex = '60';
        c.style.borderRadius = '2px';
        container.appendChild(c);
        const angle = (Math.random() - 0.5) * Math.PI * 1.2;
        const velocity = 8 + Math.random() * 12;
        const vx = Math.sin(angle) * velocity; const vy = -Math.cos(angle) * velocity;
        let x = 0; let y = 0; let opacity = 1;
        const animate = () => {
            x += vx; y += vy + 0.3; opacity -= 0.008;
            c.style.transform = `translate(${x}px, ${y}px) rotate(${x*15}deg)`;
            c.style.opacity = opacity;
            if (opacity > 0) requestAnimationFrame(animate); else c.remove();
        };
        requestAnimationFrame(animate);
    }
}

spinBtn.addEventListener('click', spin);
init();
