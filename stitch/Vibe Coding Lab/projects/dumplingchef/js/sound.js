// Sound Manager - 使用 Web Audio API 生成程序化音效
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.muted = false;
    this.masterVolume = 0.5;
    
    // 持续播放的音效节点
    this.sizzleNode = null;
    this.sizzleGain = null;
    this.warningInterval = null;
    
    // 洗碗循环音效
    this.washNode = null;
    this.washGain = null;
    
    // 搅拌机循环音效
    this.mixerNodes = null;
    this.mixerGain = null;
    
    // 脚步声计时器
    this.lastFootstepTime = 0;
    
    // BGM 节点
    this.ambientNodes = null;
    this.ambientGain = null;
    this.actionNodes = null;
    this.actionGain = null;
    this.actionInterval = null;
  }
  
  // 初始化音频上下文（需要用户交互后调用）
  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('Sound system initialized');
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }
  
  // 确保音频上下文已恢复
  ensureContext() {
    if (!this.initialized) this.init();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  // ========== 切菜音效 ==========
  // 短促、清脆的木头撞击声
  playChop() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 创建噪音源
    const bufferSize = ctx.sampleRate * 0.08;  // 80ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成噪音
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // 高通滤波器 - 让声音更清脆
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 800;
    
    // 低通滤波器 - 去掉刺耳的高频
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3000;
    
    // 音量包络
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    // 连接
    noise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.1);
  }
  
  // ========== 滋滋声（煎/煮） ==========
  // 持续的白噪音循环
  startSizzle() {
    if (this.muted || !this.initialized || this.sizzleNode) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    
    // 创建噪音缓冲
    const bufferSize = ctx.sampleRate * 2;  // 2秒循环
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    this.sizzleNode = ctx.createBufferSource();
    this.sizzleNode.buffer = buffer;
    this.sizzleNode.loop = true;
    
    // 带通滤波器 - 模拟油煎声
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 0.5;
    
    // 音量控制
    this.sizzleGain = ctx.createGain();
    this.sizzleGain.gain.value = this.masterVolume * 0.15;
    
    // 连接
    this.sizzleNode.connect(bandpass);
    bandpass.connect(this.sizzleGain);
    this.sizzleGain.connect(ctx.destination);
    
    this.sizzleNode.start();
  }
  
  stopSizzle() {
    if (this.sizzleNode) {
      this.sizzleNode.stop();
      this.sizzleNode.disconnect();
      this.sizzleNode = null;
      this.sizzleGain = null;
    }
  }
  
  // ========== 烹饪完成音效 ==========
  // 餐厅铃声 "叮" - 食物煮好了
  playDing() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 主音调
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 880;  // A5
    
    // 泛音
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1760;  // A6
    
    // 音量包络
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(this.masterVolume * 0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    // 连接
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.8);
    osc2.start(now);
    osc2.stop(now + 0.5);
  }
  
  // ========== 上菜/得分音效 ==========
  // 硬币落袋声 "叮铃铃" - 超级爽的收钱感
  playCoin() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 多个硬币声叠加，产生"叮铃铃"的效果
    const frequencies = [1400, 1800, 2200, 1600];
    const delays = [0, 0.05, 0.1, 0.15];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + delays[i] + 0.15);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(this.masterVolume * 0.35, now + delays[i]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.4);
    });
    
    // 金属碰撞的噪音层
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 4000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.15);
  }
  
  // ========== 烧焦预警 ==========
  // 高频、急促的 "哔-哔-哔"
  startWarning() {
    if (this.muted || !this.initialized || this.warningInterval) return;
    this.ensureContext();
    
    const playBeep = () => {
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 1200;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.1);
    };
    
    // 立即播放一次
    playBeep();
    
    // 每200ms播放一次
    this.warningInterval = setInterval(playBeep, 200);
  }
  
  stopWarning() {
    if (this.warningInterval) {
      clearInterval(this.warningInterval);
      this.warningInterval = null;
    }
  }
  
  // ========== 包饺子/揉面音效 ==========
  // 软糯的"噗啾"声，有弹性
  playSquish() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 低频正弦波 + 噪音混合，产生软糯感
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    
    // 噪音层 - 模拟面粉沙沙声
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // 低通滤波 - 让噪音更柔和
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;
    
    // 音量包络
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    // 连接
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
    noise.start(now);
    noise.stop(now + 0.2);
  }
  
  // ========== 洗碗循环音效 ==========
  // 流水声 + 泡沫摩擦声
  startWash() {
    if (this.muted || !this.initialized || this.washNode) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    
    // 创建噪音缓冲 - 流水声
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // 混合白噪音和调制噪音，产生流水感
      const mod = Math.sin(i / ctx.sampleRate * 20) * 0.3 + 0.7;
      data[i] = (Math.random() * 2 - 1) * mod;
    }
    
    this.washNode = ctx.createBufferSource();
    this.washNode.buffer = buffer;
    this.washNode.loop = true;
    
    // 带通滤波器 - 模拟水声
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1500;
    bandpass.Q.value = 0.8;
    
    // 音量控制
    this.washGain = ctx.createGain();
    this.washGain.gain.value = this.masterVolume * 0.12;
    
    // 连接
    this.washNode.connect(bandpass);
    bandpass.connect(this.washGain);
    this.washGain.connect(ctx.destination);
    
    this.washNode.start();
  }
  
  stopWash() {
    if (this.washNode) {
      this.washNode.stop();
      this.washNode.disconnect();
      this.washNode = null;
      this.washGain = null;
    }
  }
  
  // ========== 搅拌机循环音效 ==========
  // 低频周期性起伏 "Whir-Chug-Whir-Chug"
  startMixer() {
    if (this.muted || !this.initialized || this.mixerNodes) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    this.mixerNodes = [];
    
    // 主要低频嗡嗡声
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 80;  // 低频基础
    
    // LFO 调制频率 - 产生周期性起伏 "chug-chug"
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4;  // 每秒4次起伏
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15;  // 频率调制幅度
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    
    // 次级中频声 - 增加机械感
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 120;
    
    // LFO 调制音量 - 产生 "wum-wum" 效果
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 8;  // 更快的脉动
    
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.3;
    
    // 低通滤波器 - 让声音更浑厚
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 300;
    lowpass.Q.value = 2;
    
    // 主音量控制
    this.mixerGain = ctx.createGain();
    this.mixerGain.gain.value = this.masterVolume * 0.18;
    
    // 音量调制
    const volumeMod = ctx.createGain();
    volumeMod.gain.value = 1;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(volumeMod.gain);
    
    // 连接音频图
    osc1.connect(lowpass);
    osc2.connect(lowpass);
    lowpass.connect(volumeMod);
    volumeMod.connect(this.mixerGain);
    this.mixerGain.connect(ctx.destination);
    
    // 启动所有振荡器
    osc1.start();
    osc2.start();
    lfo.start();
    lfo2.start();
    
    this.mixerNodes = [osc1, osc2, lfo, lfo2];
  }
  
  stopMixer() {
    if (this.mixerNodes) {
      this.mixerNodes.forEach(node => {
        node.stop();
        node.disconnect();
      });
      this.mixerNodes = null;
      this.mixerGain = null;
    }
  }
  
  // ========== 洗碗完成音效 ==========
  // 清脆的盘子碰撞声 + 闪光 Bling
  playSparkle() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 高频闪光音
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2000, now);
    osc1.frequency.exponentialRampToValueAtTime(3000, now + 0.05);
    osc1.frequency.exponentialRampToValueAtTime(2500, now + 0.15);
    
    // 泛音层
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 4000;
    
    // 陶瓷碰撞的噪音
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 3000;
    
    // 音量包络
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    // 连接
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now);
    osc2.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.1);
  }
  
  // ========== 脚步声 ==========
  // 木地板上急促的 "哒-哒-哒"
  playFootstep() {
    if (this.muted || !this.initialized) return;
    
    const now = Date.now();
    // 更频繁的脚步声 - 每150ms最多播放一次（更急促）
    if (now - this.lastFootstepTime < 150) return;
    this.lastFootstepTime = now;
    
    this.ensureContext();
    
    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;
    
    // 木头撞击声 - 更短促更轻的低频
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 40, currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, currentTime + 0.03);
    
    // 噪音层 - 轻微的脚步摩擦
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 500;
    bandpass.Q.value = 1.5;
    
    // 音量降低
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.1, currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.03);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.06, currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.025);
    
    // 连接
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start(currentTime);
    osc.stop(currentTime + 0.05);
    noise.start(currentTime);
    noise.stop(currentTime + 0.04);
  }
  
  // ========== 拿取/放下音效 ==========
  // 短促的气泡声 "啵"
  playPop(isPickup = true) {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 拿起音调高，放下音调低
    const baseFreq = isPickup ? 600 : 400;
    const endFreq = isPickup ? 800 : 300;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);
    
    // 音量包络 - 快速起始，快速衰减
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    // 连接
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }
  
  // ========== 装盘音效 ==========
  // 湿润食物接触陶瓷的闷响 "啪叽"
  playPlating() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 低频闷响
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    // 湿润的噪音
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // 低通滤波 - 闷响感
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 600;
    
    // 音量
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    // 连接
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.15);
  }
  
  // ========== 开场音效 ==========
  // 锣声 - 菜单按空格时的响亮金属碰撞
  playGong() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 低频金属共鸣
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.5);
    
    // 高频金属声
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 800;
    
    // 噪音层 - 金属撞击
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    
    // 音量包络
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(this.masterVolume * 0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2);
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 2.5);
    osc2.start(now);
    osc2.stop(now + 2);
    noise.start(now);
    noise.stop(now + 0.2);
  }
  
  // 翻页声 - 清脆的纸张摩擦
  playPageFlip() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 纸张摩擦噪音
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // 高通滤波 - 让声音更清脆
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    noise.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.2);
  }
  
  // 书本合上 - 沉闷的撞击
  playThump() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 低频闷响
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    
    // 重击噪音
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.35);
    noise.start(now);
    noise.stop(now + 0.2);
  }
  
  // 倒计时滴声 - 机械的嘀嗒
  playTick() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }
  
  // 开赛大锣 - 电影级大铜锣 (Tam-tam / Chow Gong)
  // 321倒计时结束后，"哐 —————— (嗡嗡嗡)..."
  playWhistle() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const vol = this.masterVolume;
    
    // === 主干频率层 ===
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
    
    // 第一层：超低频基底 (55-62Hz) - 打在胸口的振动
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(62, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 4);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(vol * 0.8, now);
    subGain.gain.setValueAtTime(vol * 0.7, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(vol * 0.3, now + 1.5);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(now);
    subOsc.stop(now + 5);
    
    // 第二层：低频共鸣体 (110-130Hz) - 锣面主共振
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(130, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(110, now + 3);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(vol * 0.9, now);
    bodyGain.gain.exponentialRampToValueAtTime(vol * 0.4, now + 1);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + 4.5);
    
    // 第三层：中低频泛音 (~220Hz)
    const ot1 = ctx.createOscillator();
    ot1.type = 'sine';
    ot1.frequency.setValueAtTime(225, now);
    ot1.frequency.exponentialRampToValueAtTime(210, now + 3);
    const ot1Gain = ctx.createGain();
    ot1Gain.gain.setValueAtTime(vol * 0.5, now);
    ot1Gain.gain.exponentialRampToValueAtTime(vol * 0.15, now + 1.5);
    ot1Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    ot1.connect(ot1Gain);
    ot1Gain.connect(masterGain);
    ot1.start(now);
    ot1.stop(now + 4);
    
    // 第四层：中频泛音 (~370Hz) - 金属明亮感
    const ot2 = ctx.createOscillator();
    ot2.type = 'sine';
    ot2.frequency.setValueAtTime(375, now);
    ot2.frequency.exponentialRampToValueAtTime(360, now + 2);
    const ot2Gain = ctx.createGain();
    ot2Gain.gain.setValueAtTime(vol * 0.35, now);
    ot2Gain.gain.exponentialRampToValueAtTime(vol * 0.08, now + 1);
    ot2Gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
    ot2.connect(ot2Gain);
    ot2Gain.connect(masterGain);
    ot2.start(now);
    ot2.stop(now + 3.5);
    
    // 第五层：高频闪烁泛音 (Shimmer) + LFO调制 → "嗡嗡嗡"
    const shimmer1 = ctx.createOscillator();
    shimmer1.type = 'sine';
    shimmer1.frequency.setValueAtTime(685, now);
    shimmer1.frequency.exponentialRampToValueAtTime(670, now + 3);
    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.value = 3.5;
    const shimmerLfoGain = ctx.createGain();
    shimmerLfoGain.gain.value = vol * 0.08;
    const shimmer1Gain = ctx.createGain();
    shimmer1Gain.gain.setValueAtTime(vol * 0.2, now);
    shimmer1Gain.gain.exponentialRampToValueAtTime(vol * 0.06, now + 1.5);
    shimmer1Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmer1Gain.gain);
    shimmer1.connect(shimmer1Gain);
    shimmer1Gain.connect(masterGain);
    shimmer1.start(now);
    shimmer1.stop(now + 4);
    shimmerLfo.start(now);
    shimmerLfo.stop(now + 4);
    
    // 第二闪烁泛音（与第一个形成拍频）
    const shimmer2 = ctx.createOscillator();
    shimmer2.type = 'sine';
    shimmer2.frequency.setValueAtTime(1055, now);
    shimmer2.frequency.exponentialRampToValueAtTime(1030, now + 2);
    const shimmer2Gain = ctx.createGain();
    shimmer2Gain.gain.setValueAtTime(vol * 0.12, now);
    shimmer2Gain.gain.exponentialRampToValueAtTime(vol * 0.03, now + 1);
    shimmer2Gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
    shimmer2.connect(shimmer2Gain);
    shimmer2Gain.connect(masterGain);
    shimmer2.start(now);
    shimmer2.stop(now + 3.5);
    
    // === 撞击瞬态层 (猛烈的起音) ===
    const impactLen = ctx.sampleRate * 0.08;
    const impactBuf = ctx.createBuffer(1, impactLen, ctx.sampleRate);
    const impactData = impactBuf.getChannelData(0);
    for (let i = 0; i < impactLen; i++) {
      const raw = (Math.random() * 2 - 1) * Math.exp(-i / (impactLen * 0.06));
      impactData[i] = Math.tanh(raw * 3); // soft clipping → crunchy
    }
    const impactNoise = ctx.createBufferSource();
    impactNoise.buffer = impactBuf;
    const impactBP = ctx.createBiquadFilter();
    impactBP.type = 'bandpass';
    impactBP.frequency.value = 1500;
    impactBP.Q.value = 0.8;
    const impactNoiseGain = ctx.createGain();
    impactNoiseGain.gain.setValueAtTime(vol * 0.9, now);
    impactNoiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    impactNoise.connect(impactBP);
    impactBP.connect(impactNoiseGain);
    impactNoiseGain.connect(masterGain);
    impactNoise.start(now);
    impactNoise.stop(now + 0.15);
    
    // 撞击低频 - 锤头质量感
    const impactLow = ctx.createOscillator();
    impactLow.type = 'sine';
    impactLow.frequency.setValueAtTime(200, now);
    impactLow.frequency.exponentialRampToValueAtTime(90, now + 0.06);
    const impactLowGain = ctx.createGain();
    impactLowGain.gain.setValueAtTime(vol * 0.85, now);
    impactLowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    impactLow.connect(impactLowGain);
    impactLowGain.connect(masterGain);
    impactLow.start(now);
    impactLow.stop(now + 0.2);
    
    // 撞击中频 - 金属板敲击
    const impactMid = ctx.createOscillator();
    impactMid.type = 'triangle';
    impactMid.frequency.setValueAtTime(500, now);
    impactMid.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    const impactMidGain = ctx.createGain();
    impactMidGain.gain.setValueAtTime(vol * 0.5, now);
    impactMidGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    impactMid.connect(impactMidGain);
    impactMidGain.connect(masterGain);
    impactMid.start(now);
    impactMid.stop(now + 0.12);
    
    // === 余韵噪音层 (金属表面共振) ===
    const resLen = ctx.sampleRate * 2;
    const resBuf = ctx.createBuffer(1, resLen, ctx.sampleRate);
    const resData = resBuf.getChannelData(0);
    for (let i = 0; i < resLen; i++) {
      resData[i] = (Math.random() * 2 - 1);
    }
    const resNoise = ctx.createBufferSource();
    resNoise.buffer = resBuf;
    resNoise.loop = true;
    const resBP = ctx.createBiquadFilter();
    resBP.type = 'bandpass';
    resBP.frequency.setValueAtTime(800, now);
    resBP.frequency.exponentialRampToValueAtTime(500, now + 3);
    resBP.Q.value = 3;
    const resGain = ctx.createGain();
    resGain.gain.setValueAtTime(vol * 0.15, now);
    resGain.gain.setValueAtTime(vol * 0.12, now + 0.2);
    resGain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    resNoise.connect(resBP);
    resBP.connect(resGain);
    resGain.connect(masterGain);
    resNoise.start(now);
    resNoise.stop(now + 4.5);
  }
  
  // ========== 游戏结束音效 ==========
  // 急促铜锣三连 "当！当！当！" - 闷击 (Muted Staccato)
  playGameOverGong() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const vol = this.masterVolume;
    
    // 三连击，间隔递减（越来越急），力度递增
    const strikes = [
      { time: 0,    volume: 0.7,  freq: 140, decay: 0.18 },
      { time: 0.22, volume: 0.85, freq: 145, decay: 0.16 },
      { time: 0.40, volume: 1.0,  freq: 150, decay: 0.25 },
    ];
    
    strikes.forEach(strike => {
      const t = now + strike.time;
      const v = vol * strike.volume;
      
      // --- 锣体共振 (低频，被闷住所以衰减极快) ---
      const body = ctx.createOscillator();
      body.type = 'sine';
      body.frequency.setValueAtTime(strike.freq, t);
      body.frequency.exponentialRampToValueAtTime(strike.freq * 0.85, t + strike.decay);
      
      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.setValueAtTime(v * 0.9, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + strike.decay);
      
      body.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      body.start(t);
      body.stop(t + strike.decay + 0.05);
      
      // --- 泛音层 (中频金属质感，同样被闷住) ---
      const overtone = ctx.createOscillator();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(strike.freq * 2.7, t);
      overtone.frequency.exponentialRampToValueAtTime(strike.freq * 2.3, t + strike.decay * 0.7);
      
      const otGain = ctx.createGain();
      otGain.gain.setValueAtTime(0.001, now);
      otGain.gain.setValueAtTime(v * 0.4, t);
      otGain.gain.exponentialRampToValueAtTime(0.001, t + strike.decay * 0.7);
      
      overtone.connect(otGain);
      otGain.connect(ctx.destination);
      overtone.start(t);
      overtone.stop(t + strike.decay + 0.05);
      
      // --- 高泛音 (金属 shimmer，极短) ---
      const high = ctx.createOscillator();
      high.type = 'sine';
      high.frequency.setValueAtTime(strike.freq * 5.2, t);
      
      const highGain = ctx.createGain();
      highGain.gain.setValueAtTime(0.001, now);
      highGain.gain.setValueAtTime(v * 0.2, t);
      highGain.gain.exponentialRampToValueAtTime(0.001, t + strike.decay * 0.4);
      
      high.connect(highGain);
      highGain.connect(ctx.destination);
      high.start(t);
      high.stop(t + strike.decay + 0.05);
      
      // --- 撞击瞬态 (敲击的"咔"声) ---
      const impLen = ctx.sampleRate * 0.03;
      const impBuf = ctx.createBuffer(1, impLen, ctx.sampleRate);
      const impData = impBuf.getChannelData(0);
      for (let i = 0; i < impLen; i++) {
        const raw = (Math.random() * 2 - 1) * Math.exp(-i / (impLen * 0.04));
        impData[i] = Math.tanh(raw * 2.5);
      }
      const impNoise = ctx.createBufferSource();
      impNoise.buffer = impBuf;
      
      // 带通滤波 - 中频撞击感
      const impBP = ctx.createBiquadFilter();
      impBP.type = 'bandpass';
      impBP.frequency.value = 1200;
      impBP.Q.value = 1;
      
      const impGain = ctx.createGain();
      impGain.gain.setValueAtTime(0.001, now);
      impGain.gain.setValueAtTime(v * 0.6, t);
      impGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      impNoise.connect(impBP);
      impBP.connect(impGain);
      impGain.connect(ctx.destination);
      impNoise.start(t);
      impNoise.stop(t + 0.06);
      
      // --- 闷击的"手按住锣面"噪音 (每一击收尾的摩擦声) ---
      const muteLen = ctx.sampleRate * 0.06;
      const muteBuf = ctx.createBuffer(1, muteLen, ctx.sampleRate);
      const muteData = muteBuf.getChannelData(0);
      for (let i = 0; i < muteLen; i++) {
        muteData[i] = (Math.random() * 2 - 1) * (i / muteLen) * 0.3;
      }
      const muteNoise = ctx.createBufferSource();
      muteNoise.buffer = muteBuf;
      
      const muteLP = ctx.createBiquadFilter();
      muteLP.type = 'lowpass';
      muteLP.frequency.value = 600;
      
      const muteGain = ctx.createGain();
      muteGain.gain.setValueAtTime(0.001, now);
      muteGain.gain.setValueAtTime(v * 0.2, t + strike.decay * 0.8);
      muteGain.gain.exponentialRampToValueAtTime(0.001, t + strike.decay + 0.04);
      
      muteNoise.connect(muteLP);
      muteLP.connect(muteGain);
      muteGain.connect(ctx.destination);
      muteNoise.start(t + strike.decay * 0.7);
      muteNoise.stop(t + strike.decay + 0.06);
    });
  }
  
  // ========== 结算画面音效 ==========
  // 算盘拨动声 - 短促的木珠碰撞
  playAbacusTick() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const freq = 2000 + Math.random() * 1000;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.02);
    
    const bufferSize = ctx.sampleRate * 0.015;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    noise.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
    noise.start(now);
    noise.stop(now + 0.04);
  }
  
  // 盖章声 - 沉闷的木头撞击
  playStamp() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const vol = this.masterVolume;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.06));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(vol * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
    noise.start(now);
    noise.stop(now + 0.2);
  }
  
  // 欢呼声 - 三星时的庆祝 (升调和声)
  playCelebration() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const vol = this.masterVolume;
    
    // 上行和弦琶音
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const t = now + i * 0.1;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol * 0.35, t);
      gain.gain.setValueAtTime(vol * 0.35, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.7);
    });
    
    // 闪烁高频点缀
    for (let i = 0; i < 5; i++) {
      const t = now + 0.4 + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 1500;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(vol * 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }
  
  // ========== 订单音效 ==========
  
  // 新订单 - 纸张滑动 + 小铃铛
  playNewOrder() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const vol = this.masterVolume;
    
    // 纸张滑动声 (高频滤波噪声，快速衰减)
    const paperLen = Math.floor(ctx.sampleRate * 0.12);
    const paperBuf = ctx.createBuffer(1, paperLen, ctx.sampleRate);
    const pd = paperBuf.getChannelData(0);
    for (let i = 0; i < paperLen; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.exp(-t * 25);
      // 快速刮擦质感
      pd[i] = (Math.random() * 2 - 1) * env * (0.5 + Math.sin(i * 0.3) * 0.3);
    }
    const paperSrc = ctx.createBufferSource();
    paperSrc.buffer = paperBuf;
    
    const paperBP = ctx.createBiquadFilter();
    paperBP.type = 'bandpass';
    paperBP.frequency.value = 4000;
    paperBP.Q.value = 1.5;
    
    const paperGain = ctx.createGain();
    paperGain.gain.setValueAtTime(vol * 0.25, now);
    paperGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    paperSrc.connect(paperBP);
    paperBP.connect(paperGain);
    paperGain.connect(ctx.destination);
    paperSrc.start(now);
    paperSrc.stop(now + 0.15);
    
    // 小铃铛 (高频正弦 + 泛音，延迟一点点)
    const bellDelay = 0.06;
    const bellFreqs = [2800, 5600, 4200];
    bellFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const g = ctx.createGain();
      const amp = (i === 0 ? 0.2 : 0.08) * vol;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(amp, now + bellDelay);
      g.gain.exponentialRampToValueAtTime(0.001, now + bellDelay + 0.25);
      
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + bellDelay);
      osc.stop(now + bellDelay + 0.3);
    });
  }
  
  // 完成订单 - 干脆撕纸声 "Rrrrip!"
  playOrderComplete() {
    if (this.muted || !this.initialized) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const vol = this.masterVolume;
    
    // 撕纸噪声 (短促、有力的宽频噪声 + 频率下滑)
    const ripLen = Math.floor(ctx.sampleRate * 0.08);
    const ripBuf = ctx.createBuffer(1, ripLen, ctx.sampleRate);
    const rd = ripBuf.getChannelData(0);
    for (let i = 0; i < ripLen; i++) {
      const t = i / ctx.sampleRate;
      // 快速起音、急速衰减 - 一把扯下的感觉
      const env = (t < 0.005 ? t / 0.005 : 1) * Math.exp(-t * 40);
      // 粗糙纤维断裂质感
      const crackle = Math.random() * 2 - 1;
      const grain = Math.sin(i * (0.8 + Math.random() * 0.4)) * 0.5;
      rd[i] = (crackle * 0.7 + grain * 0.3) * env;
    }
    const ripSrc = ctx.createBufferSource();
    ripSrc.buffer = ripBuf;
    
    // 带通滤波让纸质感更突出
    const ripBP = ctx.createBiquadFilter();
    ripBP.type = 'bandpass';
    ripBP.frequency.value = 3500;
    ripBP.Q.value = 0.8;
    
    const ripGain = ctx.createGain();
    ripGain.gain.setValueAtTime(vol * 0.4, now);
    ripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    ripSrc.connect(ripBP);
    ripBP.connect(ripGain);
    ripGain.connect(ctx.destination);
    ripSrc.start(now);
    ripSrc.stop(now + 0.1);
    
    // 尾部轻微纸片掉落声
    const tailLen = Math.floor(ctx.sampleRate * 0.04);
    const tailBuf = ctx.createBuffer(1, tailLen, ctx.sampleRate);
    const td = tailBuf.getChannelData(0);
    for (let i = 0; i < tailLen; i++) {
      td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (tailLen * 0.05)) * 0.3;
    }
    const tailSrc = ctx.createBufferSource();
    tailSrc.buffer = tailBuf;
    
    const tailHP = ctx.createBiquadFilter();
    tailHP.type = 'highpass';
    tailHP.frequency.value = 5000;
    
    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(vol * 0.15, now + 0.06);
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    tailSrc.connect(tailHP);
    tailHP.connect(tailGain);
    tailGain.connect(ctx.destination);
    tailSrc.start(now + 0.06);
    tailSrc.stop(now + 0.15);
  }
  
  // ========== BGM ==========
  
  // 氛围声景 - 主菜单/菜谱/结算界面
  // Lo-fi industrial soundscape: 蒸汽白噪音底层 + 低频脉冲心跳 + 零星古筝拨弦 + 偶发锣声共鸣
  startAmbientBGM() {
    if (this.muted || !this.initialized) return;
    if (this.ambientNodes) return; // 已在播放
    this.ensureContext();
    
    const ctx = this.audioContext;
    const vol = this.masterVolume;
    const nodes = [];
    
    // === 主输出增益 ===
    const masterGain = ctx.createGain();
    masterGain.gain.value = vol * 0.35;
    masterGain.connect(ctx.destination);
    this.ambientGain = masterGain;
    
    // === 1. 蒸汽/厨房白噪音底层 (连续) ===
    const steamBufferSize = ctx.sampleRate * 4;
    const steamBuffer = ctx.createBuffer(1, steamBufferSize, ctx.sampleRate);
    const steamData = steamBuffer.getChannelData(0);
    for (let i = 0; i < steamBufferSize; i++) {
      // 带有轻微周期性起伏的粉红噪声
      const white = Math.random() * 2 - 1;
      const mod = 0.6 + 0.4 * Math.sin(i / ctx.sampleRate * 0.3 * Math.PI * 2);
      steamData[i] = white * mod * 0.5;
    }
    const steamSource = ctx.createBufferSource();
    steamSource.buffer = steamBuffer;
    steamSource.loop = true;
    
    const steamLP = ctx.createBiquadFilter();
    steamLP.type = 'lowpass';
    steamLP.frequency.value = 2000;
    steamLP.Q.value = 0.5;
    
    const steamHP = ctx.createBiquadFilter();
    steamHP.type = 'highpass';
    steamHP.frequency.value = 200;
    
    const steamGain = ctx.createGain();
    steamGain.gain.value = 0.3;
    
    steamSource.connect(steamHP);
    steamHP.connect(steamLP);
    steamLP.connect(steamGain);
    steamGain.connect(masterGain);
    steamSource.start();
    nodes.push(steamSource);
    
    // === 2. 低频心跳脉冲 (80 BPM = 每 0.75 秒) ===
    const beatInterval = 0.75; // 80 BPM
    const loopDuration = beatInterval * 16; // 12 秒循环
    const pulseBuffer = ctx.createBuffer(1, ctx.sampleRate * loopDuration, ctx.sampleRate);
    const pulseData = pulseBuffer.getChannelData(0);
    for (let beat = 0; beat < 16; beat++) {
      const beatStart = Math.floor(beat * beatInterval * ctx.sampleRate);
      const beatSamples = Math.floor(0.3 * ctx.sampleRate);
      for (let i = 0; i < beatSamples && beatStart + i < pulseData.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 8);
        // 低沉的子低音 + 轻微泛音
        pulseData[beatStart + i] = (
          Math.sin(2 * Math.PI * 40 * t) * 0.7 +
          Math.sin(2 * Math.PI * 80 * t) * 0.2 +
          Math.sin(2 * Math.PI * 60 * t) * 0.1
        ) * env;
      }
    }
    const pulseSource = ctx.createBufferSource();
    pulseSource.buffer = pulseBuffer;
    pulseSource.loop = true;
    
    const pulseLPF = ctx.createBiquadFilter();
    pulseLPF.type = 'lowpass';
    pulseLPF.frequency.value = 120;
    
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.6;
    
    pulseSource.connect(pulseLPF);
    pulseLPF.connect(pulseGain);
    pulseGain.connect(masterGain);
    pulseSource.start();
    nodes.push(pulseSource);
    
    // === 3. 零星古筝拨弦 + 偶发锣声 (定时触发) ===
    const guzhengNotes = [196, 220, 262, 294, 392, 440, 523]; // 中国五声音阶附近
    
    const playGuzheng = () => {
      if (this.muted || !this.ambientNodes) return;
      const freq = guzhengNotes[Math.floor(Math.random() * guzhengNotes.length)];
      
      const now = ctx.currentTime;
      
      // 基音（正弦 + 方波泛音模拟弦振动）
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = freq;
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2.01; // 轻微走调的泛音
      
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = freq * 3;
      
      // 拨弦噪声（起始）
      const noiseLen = Math.floor(ctx.sampleRate * 0.02);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.1));
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.25, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.08, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(0.04, now);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0.15, now);
      noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc1.connect(g1); g1.connect(masterGain);
      osc2.connect(g2); g2.connect(masterGain);
      osc3.connect(g3); g3.connect(masterGain);
      noiseSrc.connect(noiseG); noiseG.connect(masterGain);
      
      osc1.start(now); osc1.stop(now + 2.5);
      osc2.start(now); osc2.stop(now + 1.5);
      osc3.start(now); osc3.stop(now + 1.0);
      noiseSrc.start(now); noiseSrc.stop(now + 0.05);
    };
    
    const playGongResonance = () => {
      if (this.muted || !this.ambientNodes) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 4);
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(130, now);
      osc2.frequency.exponentialRampToValueAtTime(110, now + 3);
      
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 4);
      
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.06, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 3);
      
      osc.connect(g); g.connect(masterGain);
      osc2.connect(g2); g2.connect(masterGain);
      
      osc.start(now); osc.stop(now + 4);
      osc2.start(now); osc2.stop(now + 3);
    };
    
    // 随机间隔触发古筝 (2-5秒) 和锣声 (8-15秒)
    let guzhengTimer, gongTimer;
    const scheduleGuzheng = () => {
      if (!this.ambientNodes) return;
      const delay = 2000 + Math.random() * 3000;
      guzhengTimer = setTimeout(() => {
        playGuzheng();
        scheduleGuzheng();
      }, delay);
    };
    const scheduleGong = () => {
      if (!this.ambientNodes) return;
      const delay = 8000 + Math.random() * 7000;
      gongTimer = setTimeout(() => {
        playGongResonance();
        scheduleGong();
      }, delay);
    };
    
    scheduleGuzheng();
    scheduleGong();
    
    // 存储引用以便停止
    this.ambientNodes = { sources: nodes, guzhengTimer, gongTimer };
  }
  
  stopAmbientBGM() {
    if (this.ambientNodes) {
      this.ambientNodes.sources.forEach(s => { try { s.stop(); } catch(e) {} });
      clearTimeout(this.ambientNodes.guzhengTimer);
      clearTimeout(this.ambientNodes.gongTimer);
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
      this.ambientNodes = null;
    }
  }
  
  // 战斗乐 - 正式游戏
  // Electro-Swing + Chinese Lion Dance percussion: 128 BPM, 808 kick, 堂鼓, 钹, 唢呐短音
  startActionBGM() {
    if (this.muted || !this.initialized) return;
    if (this.actionNodes) return;
    this.ensureContext();
    
    const ctx = this.audioContext;
    const vol = this.masterVolume;
    const nodes = [];
    
    // === 主输出 ===
    const masterGain = ctx.createGain();
    masterGain.gain.value = vol * 0.3;
    masterGain.connect(ctx.destination);
    this.actionGain = masterGain;
    
    const BPM = 128;
    const beatSec = 60 / BPM; // ~0.469s
    const barSec = beatSec * 4; // ~1.875s
    const loopBars = 4;
    const loopSec = barSec * loopBars; // ~7.5s
    const loopSamples = Math.floor(ctx.sampleRate * loopSec);
    
    // === 1. 808 Kick Drum Pattern ===
    // 四拍底鼓 (Four-on-the-floor)
    const kickBuffer = ctx.createBuffer(1, loopSamples, ctx.sampleRate);
    const kickData = kickBuffer.getChannelData(0);
    for (let bar = 0; bar < loopBars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const beatStart = Math.floor((bar * barSec + beat * beatSec) * ctx.sampleRate);
        const kickLen = Math.floor(0.15 * ctx.sampleRate);
        for (let i = 0; i < kickLen && beatStart + i < kickData.length; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t * 25);
          // 808 特色：快速频率下滑
          const freq = 150 * Math.exp(-t * 30) + 45;
          kickData[beatStart + i] += Math.sin(2 * Math.PI * freq * t) * env * 0.8;
        }
      }
    }
    const kickSource = ctx.createBufferSource();
    kickSource.buffer = kickBuffer;
    kickSource.loop = true;
    const kickGain = ctx.createGain();
    kickGain.gain.value = 0.7;
    kickSource.connect(kickGain);
    kickGain.connect(masterGain);
    kickSource.start();
    nodes.push(kickSource);
    
    // === 2. Hi-hat Pattern (金属感, 八分音符 + 偶尔开叉) ===
    const hatBuffer = ctx.createBuffer(1, loopSamples, ctx.sampleRate);
    const hatData = hatBuffer.getChannelData(0);
    for (let bar = 0; bar < loopBars; bar++) {
      for (let eighth = 0; eighth < 8; eighth++) {
        const pos = Math.floor((bar * barSec + eighth * beatSec / 2) * ctx.sampleRate);
        const isOpen = (eighth === 2 || eighth === 6); // 开叉
        const dur = isOpen ? 0.08 : 0.03;
        const hatLen = Math.floor(dur * ctx.sampleRate);
        const hatVol = (eighth % 2 === 0) ? 0.5 : 0.3; // 强弱交替
        for (let i = 0; i < hatLen && pos + i < hatData.length; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t * (isOpen ? 30 : 80));
          hatData[pos + i] += (Math.random() * 2 - 1) * env * hatVol;
        }
      }
    }
    const hatSource = ctx.createBufferSource();
    hatSource.buffer = hatBuffer;
    hatSource.loop = true;
    const hatHP = ctx.createBiquadFilter();
    hatHP.type = 'highpass';
    hatHP.frequency.value = 7000;
    const hatGain = ctx.createGain();
    hatGain.gain.value = 0.35;
    hatSource.connect(hatHP);
    hatHP.connect(hatGain);
    hatGain.connect(masterGain);
    hatSource.start();
    nodes.push(hatSource);
    
    // === 3. 堂鼓 (Tanggu) Pattern - 舞狮节奏 ===
    const tangguBuffer = ctx.createBuffer(1, loopSamples, ctx.sampleRate);
    const tangguData = tangguBuffer.getChannelData(0);
    // 舞狮节奏型: 咚 - 咚 嚓 - 咚-咚 嚓咚 (每小节不同变化)
    const tangguPattern = [
      // bar 0: 基础节奏
      [0, 1.5, 2, 3, 3.5],
      // bar 1: 紧密
      [0, 0.5, 1.5, 2, 3, 3.75],
      // bar 2: 同 bar 0
      [0, 1.5, 2, 3, 3.5],
      // bar 3: 密集收尾
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
    ];
    for (let bar = 0; bar < loopBars; bar++) {
      tangguPattern[bar].forEach(beat => {
        const pos = Math.floor((bar * barSec + beat * beatSec) * ctx.sampleRate);
        const isAccent = (beat === 0 || beat === 2);
        const dur = 0.12;
        const tangguLen = Math.floor(dur * ctx.sampleRate);
        const tangguVol = isAccent ? 0.7 : 0.4;
        for (let i = 0; i < tangguLen && pos + i < tangguData.length; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t * 20);
          // 堂鼓：低频体鸣 + 鼓皮噪声
          const body = Math.sin(2 * Math.PI * 90 * t) * 0.6 + Math.sin(2 * Math.PI * 180 * t) * 0.2;
          const skin = (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.3;
          tangguData[pos + i] += (body + skin) * env * tangguVol;
        }
      });
    }
    const tangguSource = ctx.createBufferSource();
    tangguSource.buffer = tangguBuffer;
    tangguSource.loop = true;
    const tangguGain = ctx.createGain();
    tangguGain.gain.value = 0.55;
    tangguSource.connect(tangguGain);
    tangguGain.connect(masterGain);
    tangguSource.start();
    nodes.push(tangguSource);
    
    // === 4. 钹/Cymbal Crashes (每 2 拍) ===
    const cymbalBuffer = ctx.createBuffer(1, loopSamples, ctx.sampleRate);
    const cymbalData = cymbalBuffer.getChannelData(0);
    for (let bar = 0; bar < loopBars; bar++) {
      const crashes = (bar === 3) ? [0, 1, 2, 3] : [0, 2]; // 最后一小节加密
      crashes.forEach(beat => {
        const pos = Math.floor((bar * barSec + beat * beatSec) * ctx.sampleRate);
        const len = Math.floor(0.15 * ctx.sampleRate);
        for (let i = 0; i < len && pos + i < cymbalData.length; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t * 15);
          cymbalData[pos + i] += (Math.random() * 2 - 1) * env * 0.3;
        }
      });
    }
    const cymbalSource = ctx.createBufferSource();
    cymbalSource.buffer = cymbalBuffer;
    cymbalSource.loop = true;
    const cymbalBP = ctx.createBiquadFilter();
    cymbalBP.type = 'bandpass';
    cymbalBP.frequency.value = 5000;
    cymbalBP.Q.value = 0.8;
    const cymbalGain = ctx.createGain();
    cymbalGain.gain.value = 0.25;
    cymbalSource.connect(cymbalBP);
    cymbalBP.connect(cymbalGain);
    cymbalGain.connect(masterGain);
    cymbalSource.start();
    nodes.push(cymbalSource);
    
    // === 5. Funky Bassline (合成贝斯) ===
    const bassBuffer = ctx.createBuffer(1, loopSamples, ctx.sampleRate);
    const bassData = bassBuffer.getChannelData(0);
    // 五声音阶贝斯旋律 (E2 区域)
    const bassNotes = [
      // bar 0
      { beat: 0, note: 82, dur: 0.2 }, { beat: 1, note: 98, dur: 0.15 },
      { beat: 1.5, note: 82, dur: 0.1 }, { beat: 2, note: 110, dur: 0.2 },
      { beat: 3, note: 98, dur: 0.15 }, { beat: 3.5, note: 82, dur: 0.1 },
      // bar 1
      { beat: 4, note: 73, dur: 0.2 }, { beat: 5, note: 82, dur: 0.15 },
      { beat: 5.5, note: 98, dur: 0.1 }, { beat: 6, note: 110, dur: 0.2 },
      { beat: 7, note: 82, dur: 0.15 },
      // bar 2
      { beat: 8, note: 82, dur: 0.2 }, { beat: 9, note: 98, dur: 0.15 },
      { beat: 9.5, note: 110, dur: 0.1 }, { beat: 10, note: 82, dur: 0.2 },
      { beat: 11, note: 73, dur: 0.2 }, { beat: 11.5, note: 82, dur: 0.1 },
      // bar 3
      { beat: 12, note: 110, dur: 0.2 }, { beat: 13, note: 98, dur: 0.15 },
      { beat: 13.5, note: 82, dur: 0.1 }, { beat: 14, note: 73, dur: 0.25 },
      { beat: 15, note: 82, dur: 0.15 }, { beat: 15.5, note: 98, dur: 0.1 },
    ];
    bassNotes.forEach(n => {
      const pos = Math.floor(n.beat * beatSec * ctx.sampleRate);
      const len = Math.floor(n.dur * ctx.sampleRate);
      for (let i = 0; i < len && pos + i < bassData.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 8);
        // 方波特色贝斯
        const phase = (n.note * t) % 1;
        const sq = phase < 0.5 ? 1 : -1;
        bassData[pos + i] += sq * env * 0.3 + Math.sin(2 * Math.PI * n.note * t) * env * 0.2;
      }
    });
    const bassSource = ctx.createBufferSource();
    bassSource.buffer = bassBuffer;
    bassSource.loop = true;
    const bassLP = ctx.createBiquadFilter();
    bassLP.type = 'lowpass';
    bassLP.frequency.value = 400;
    const bassGainNode = ctx.createGain();
    bassGainNode.gain.value = 0.5;
    bassSource.connect(bassLP);
    bassLP.connect(bassGainNode);
    bassGainNode.connect(masterGain);
    bassSource.start();
    nodes.push(bassSource);
    
    // === 6. 唢呐短音 Stabs (定时随机触发) ===
    const suonaNotes = [523, 587, 659, 784, 880, 1047]; // C5-C6 五声
    const suonaPatterns = [
      // 短促的节奏型 stab
      [0, 0.5],
      [0, 1.5, 2],
      [0],
      [0, 0.25, 0.5, 2],
    ];
    let suonaBar = 0;
    
    const playSuonaStab = () => {
      if (this.muted || !this.actionNodes) return;
      const now = ctx.currentTime;
      const pattern = suonaPatterns[suonaBar % suonaPatterns.length];
      suonaBar++;
      
      pattern.forEach(beat => {
        const t = now + beat * beatSec;
        const freq = suonaNotes[Math.floor(Math.random() * suonaNotes.length)];
        
        // 唢呐：方波 + 高频泛音 + 鼻音滤波
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = freq;
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = freq * 1.01;
        
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = freq * 2;
        bp.Q.value = 3;
        
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.2, t);
        g.gain.setValueAtTime(0.2, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.001, now);
        g2.gain.linearRampToValueAtTime(0.08, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc1.connect(bp);
        bp.connect(g);
        g.connect(masterGain);
        osc2.connect(g2);
        g2.connect(masterGain);
        
        osc1.start(t);
        osc1.stop(t + 0.25);
        osc2.start(t);
        osc2.stop(t + 0.2);
      });
    };
    
    // 每 2 小节（~3.75 秒）触发一次唢呐
    this.actionInterval = setInterval(() => {
      if (this.actionNodes) playSuonaStab();
    }, barSec * 2 * 1000);
    // 开局也来一次
    setTimeout(() => playSuonaStab(), 500);
    
    this.actionNodes = { sources: nodes };
  }
  
  stopActionBGM() {
    if (this.actionNodes) {
      this.actionNodes.sources.forEach(s => { try { s.stop(); } catch(e) {} });
      if (this.actionGain) {
        this.actionGain.disconnect();
        this.actionGain = null;
      }
      if (this.actionInterval) {
        clearInterval(this.actionInterval);
        this.actionInterval = null;
      }
      this.actionNodes = null;
    }
  }
  
  // ========== 控制方法 ==========
  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.stopSizzle();
      this.stopWarning();
      this.stopWash();
      this.stopMixer();
      this.stopAmbientBGM();
      this.stopActionBGM();
    }
  }
  
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }
  
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.sizzleGain) {
      this.sizzleGain.gain.value = this.masterVolume * 0.15;
    }
    if (this.washGain) {
      this.washGain.gain.value = this.masterVolume * 0.12;
    }
    if (this.mixerGain) {
      this.mixerGain.gain.value = this.masterVolume * 0.18;
    }
    if (this.ambientGain) {
      this.ambientGain.gain.value = this.masterVolume * 0.35;
    }
    if (this.actionGain) {
      this.actionGain.gain.value = this.masterVolume * 0.3;
    }
  }
}

// 导出单例
export const soundManager = new SoundManager();
