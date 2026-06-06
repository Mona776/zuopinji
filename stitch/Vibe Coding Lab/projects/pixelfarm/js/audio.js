// Audio Manager - Cloudinary hosted audio
const CDN = 'https://res.cloudinary.com/djkewbcp6/video/upload/v1768071954/audio/audio';

export class AudioManager {
  constructor() {
    this.bgm = null;
    this.bgmVolume = 0.3;
    this.sfxVolume = 0.5;
    this.isMuted = false;
    this.userInteracted = false;
    this.currentScene = null;
    this.walkCooldown = 0;
    
    // BGM tracks
    this.bgmTracks = {
      outdoor: `${CDN}/bgm_outdoor.mp3`,
      indoor: `${CDN}/bgm_indoor.mp3`
    };
    
    // SFX: name -> [url, duration in seconds]
    this.sfx = {
      walk:       [`${CDN}/sfx_walk.mp3`, 0.25],
      hoe:        [`${CDN}/sfx_hoe.mp3`, 0.4],
      plant:      [`${CDN}/sfx_plant.mp3`, 0.3],
      water:      [`${CDN}/sfx_water.mp3`, 0.5],
      harvest:    [`${CDN}/sfx_harvest.mp3`, 0.8],
      interact:   [`${CDN}/sfx_interact.mp3`, 0.3],
      portal:     [`${CDN}/sfx_portal.wav`, 0.5],
      ui_click:   [`${CDN}/sfx_click.wav`, 0.15],
      unlock:     [`${CDN}/sfx_unlock.wav`, 0.8],
      place:      [`${CDN}/sfx_place.mp3`, 0.3],
      buy:        [`${CDN}/sfx_buy.mp3`, 0.8],
      coins:      [`${CDN}/sfx_coins.wav`, 0.5],
      pickup:     [`${CDN}/sfx_interact.mp3`, 0.25],
      dog_bark:   [`${CDN}/sfx_dog_bark.mp3`, 0.5],
      player_hum: [`${CDN}/sfx_player_hum.mp3`, 3]
    };
    
    // Audio pool for frequent sounds
    this.pool = {};
    ['walk', 'ui_click', 'interact'].forEach(name => {
      this.pool[name] = Array.from({length: 3}, () => new Audio(this.sfx[name][0]));
      this.pool[name].idx = 0;
    });
  }
  
  init() {
    const unlock = (e) => {
      if (this.userInteracted) return;
      this.userInteracted = true;
      this.playBGM(this.currentScene || 'outdoor');
      ['click', 'keydown', 'touchstart'].forEach(evt => 
        document.removeEventListener(evt, unlock, true)
      );
    };
    ['click', 'keydown', 'touchstart'].forEach(evt => 
      document.addEventListener(evt, unlock, {capture: true, passive: true})
    );
  }
  
  playBGM(scene) {
    this.currentScene = scene;
    if (!this.userInteracted) return;
    
    const src = this.bgmTracks[scene];
    if (!src || (this.bgm?.src.includes(scene) && !this.bgm.paused)) return;
    
    this.stopBGM();
    this.bgm = new Audio(src);
    this.bgm.loop = true;
    this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    this.bgm.play().catch(() => {});
  }
  
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }
  }
  
  playSFX(name) {
    if (this.isMuted || !this.userInteracted) return;
    
    const cfg = this.sfx[name];
    if (!cfg) return;
    
    let audio;
    if (this.pool[name]) {
      const p = this.pool[name];
      audio = p[p.idx];
      p.idx = (p.idx + 1) % p.length;
      audio.currentTime = 0;
    } else {
      audio = new Audio(cfg[0]);
    }
    
    audio.volume = this.sfxVolume;
    audio.play().catch(() => {});
    
    if (cfg[1] > 0) {
      setTimeout(() => { audio.pause(); audio.currentTime = 0; }, cfg[1] * 1000);
    }
  }
  
  playWalkSound() {
    if (this.walkCooldown > 0) return;
    this.playSFX('walk');
    this.walkCooldown = 0.35;
  }
  
  update(dt) {
    if (this.walkCooldown > 0) this.walkCooldown -= dt;
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    return this.isMuted;
  }
  
  tryAutoPlay() {
    if (!this.currentScene) return;
    const test = new Audio(this.bgmTracks[this.currentScene]);
    test.volume = 0.001;
    test.play().then(() => {
      test.pause();
      this.userInteracted = true;
      this.playBGM(this.currentScene);
    }).catch(() => {});
  }
}
