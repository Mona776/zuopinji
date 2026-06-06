class AudioController {
    constructor() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.notes = {
        'KeyA': 261.63, // C4
        'KeyS': 293.66, // D4
        'KeyD': 329.63, // E4
        'KeyF': 392.00, // G4
        'KeyG': 440.00, // A4
        'KeyH': 523.25, // C5
        'KeyJ': 587.33, // D5
        'KeyK': 659.25  // E5
      };
      
      this.isInitialized = false;
      this.ambienceNodes = null;
      this.fireplaceNodes = null; 
      
      // Music State
      this.isPlayingMusic = false;
      this.musicTimer = null;
      this.melodyNoteIndex = 0;
      
      // Silent Night / Ambient Melody
      const G4 = 392.00;
      const A4 = 440.00;
      const E4 = 329.63;
      const D5 = 587.33;
      const B4 = 493.88;
      const C5 = 523.25;
      
      // Sequence: [freq, duration]
      this.melody = [
          { f: G4, d: 2 }, { f: A4, d: 0.5 }, { f: G4, d: 1 }, { f: E4, d: 4 }, // Si-lent Night
          { f: G4, d: 2 }, { f: A4, d: 0.5 }, { f: G4, d: 1 }, { f: E4, d: 4 }, // Ho-ly Night
          { f: D5, d: 2 }, { f: D5, d: 1.5 }, { f: B4, d: 4 },               // All is calm
          { f: C5, d: 2 }, { f: C5, d: 1.5 }, { f: G4, d: 4 }                // All is bright
      ];
  
      // Attempt to resume on any interaction
      ['click', 'keydown', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => this.init(), { once: true });
      });
    }
  
    init() {
      if (this.isInitialized && this.ctx.state === 'running') return;
      
      this.ctx.resume().then(() => {
        this.isInitialized = true;
        console.log("Audio Context Resumed/Initialized");
        this.startAmbience();
        this.startFireplace(); 
        this.startMusic();
      }).catch(e => console.error("Audio Context Init Failed:", e));
    }
  
    startAmbience() {
      if (this.ambienceNodes) return;
  
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Pink Noise
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.11; 
          b6 = white * 0.115926;
      }
  
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = buffer;
      noiseSrc.loop = true;
  
      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 300; 
      windFilter.Q.value = 0.5;
  
      const windLFO = this.ctx.createOscillator();
      windLFO.type = 'sine';
      windLFO.frequency.value = 0.15; 
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 150; 
      
      windLFO.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
  
      const windGain = this.ctx.createGain();
      windGain.gain.value = 0.15; 
  
      noiseSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ctx.destination);
  
      noiseSrc.start(t);
      windLFO.start(t);
  
      this.ambienceNodes = { noiseSrc, windLFO, windGain };
    }
    
    startFireplace() {
        if (this.fireplaceNodes) return;
        
        const t = this.ctx.currentTime;
        
        // Rumble
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for(let i=0; i<bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const rumbleSrc = this.ctx.createBufferSource();
        rumbleSrc.buffer = buffer;
        rumbleSrc.loop = true;
        
        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 150; 
        
        const rumbleGain = this.ctx.createGain();
        rumbleGain.gain.value = 0.8; 
        
        rumbleSrc.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        
        // Crackle
        const clickBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 5, this.ctx.sampleRate);
        const cData = clickBuffer.getChannelData(0);
        
        for(let i=0; i<cData.length; i++) {
            if (Math.random() > 0.9995) { 
               cData[i] = (Math.random() * 0.5) + 0.5;
               if (i+1 < cData.length) cData[i+1] = -cData[i] * 0.5; 
            } else {
               cData[i] = 0;
            }
        }
        
        const crackleSrc = this.ctx.createBufferSource();
        crackleSrc.buffer = clickBuffer;
        crackleSrc.loop = true;
        
        const crackleFilter = this.ctx.createBiquadFilter();
        crackleFilter.type = 'highpass';
        crackleFilter.frequency.value = 1000; 
        
        const crackleGain = this.ctx.createGain();
        crackleGain.gain.value = 0.6;
        
        crackleSrc.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        
        const masterFireGain = this.ctx.createGain();
        masterFireGain.gain.value = 0; 
        
        rumbleGain.connect(masterFireGain);
        crackleGain.connect(masterFireGain);
        masterFireGain.connect(this.ctx.destination);
        
        rumbleSrc.start(t);
        crackleSrc.start(t);
        
        this.fireplaceNodes = { masterFireGain };
    }
  
    updateFireplaceVolume(distance) {
        if (!this.fireplaceNodes) return;
        
        let vol = 0;
        if (distance < 8) {
            vol = 1.0;
        } else if (distance < 20) {
            vol = 1.0 - ((distance - 8) / 12);
        } else {
            vol = 0;
        }
        
        const t = this.ctx.currentTime;
        this.fireplaceNodes.masterFireGain.gain.setTargetAtTime(vol * 0.3, t, 0.1); 
    }
  
    startMusic() {
        if (!window.gameState) return;
        const phase = window.gameState.getPhase();
        if (phase !== 'ZENITH' && phase !== 'ETERNAL') return;
  
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this.playNextMelodyNote();
    }
  
    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }
  
    playNextMelodyNote() {
        if (!this.isPlayingMusic) return;
        
        if (window.gameState) {
            const phase = window.gameState.getPhase();
            if (phase !== 'ZENITH' && phase !== 'ETERNAL') {
                this.stopMusic();
                return;
            }
        }
        
        const note = this.melody[this.melodyNoteIndex];
        const t = this.ctx.currentTime;
        
        // Determine Tempo and Volume based on phase
        const isEternal = window.gameState && window.gameState.getPhase() === 'ETERNAL';
        const tempoScale = isEternal ? 2.5 : 1.2; // Much slower in Eternal
        const volumeScale = isEternal ? 0.015 : 0.04; // Quieter in Eternal
  
        // Melody Voice
        const osc = this.ctx.createOscillator();
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(note.f, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        
        // Softer attack for Eternal
        const attack = isEternal ? 1.5 : 0.5;
        gain.gain.linearRampToValueAtTime(volumeScale, t + attack); 
        
        const sustain = note.d * (isEternal ? 1.5 : 1.0);
        gain.gain.setValueAtTime(volumeScale, t + sustain - 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sustain + 2.0); 
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + sustain + 4);
  
        this.melodyNoteIndex = (this.melodyNoteIndex + 1) % this.melody.length;
        
        this.musicTimer = setTimeout(() => this.playNextMelodyNote(), note.d * 1000 * tempoScale);
    }
  
    playNote(keyCode) {
      let freq = this.notes[keyCode];
      
      if (!freq && keyCode === 'TEST') {
        const keys = Object.keys(this.notes);
        freq = this.notes[keys[Math.floor(Math.random() * keys.length)]];
      }
      
      if (!freq) return null;
      
      if (this.ctx.state === 'suspended') {
        this.init();
      }
  
      const t = this.ctx.currentTime;
  
      const masterGain = this.ctx.createGain();
      masterGain.connect(this.ctx.destination);
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      masterGain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
  
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);
      osc1.connect(masterGain);
  
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, t);
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.08, t);
      osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      osc2.connect(osc2Gain);
      osc2Gain.connect(masterGain);
  
      osc1.start(t);
      osc2.start(t);
      
      osc1.stop(t + 5.0);
      osc2.stop(t + 5.0);
  
      setTimeout(() => {
          masterGain.disconnect();
      }, 5500);
      
      return freq;
    }
  }
  
  window.audioController = new AudioController();
  