// ── WebGL 初始化 ──────────────────────────────────────────
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) { document.body.innerHTML='<p style="color:#0f8;padding:40px;font-family:monospace">WebGL2 NOT SUPPORTED</p>'; }

function mkShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}
const prog = gl.createProgram();
gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   window.VERT_SRC));
gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, window.FRAG_SRC));
gl.linkProgram(prog); gl.useProgram(prog);

const vbuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
const aPos = gl.getAttribLocation(prog, 'aPos');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

const uLoc = {
  bg:gl.getUniformLocation(prog,'uBg'), res:gl.getUniformLocation(prog,'uRes'),
  time:gl.getUniformLocation(prog,'uTime'), rain:gl.getUniformLocation(prog,'uRain'),
  fog:gl.getUniformLocation(prog,'uFog'), refr:gl.getUniformLocation(prog,'uRefr'),
  media:gl.getUniformLocation(prog,'uHasMedia')
};

const bgTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, bgTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));

let hasMedia=false, videoEl=null;
const params = {rain:0.70, fog:0.30, refr:0.60};

// ── 默认背景 ──────────────────────────────────────────────
const DEFAULT_BG_VIDEO = 'default-bg.mp4';
const DEFAULT_BG_IMAGE = 'default-bg.jpg';

function tryLoadDefaultBg() {
  const vid = document.createElement('video');
  vid.loop        = true;
  vid.muted       = true;
  vid.playsInline = true;
  vid.preload     = 'auto';

  vid.addEventListener('canplaythrough', () => {
    vid.play().then(() => {
      videoEl  = vid;
      hasMedia = true;
    }).catch(e => {
      console.warn('video autoplay blocked, trying image fallback', e);
      loadDefaultImage();
    });
  }, { once: true });

  vid.addEventListener('error', () => {
    console.warn('default-bg.mp4 not found, trying image...');
    loadDefaultImage();
  }, { once: true });

  vid.src = DEFAULT_BG_VIDEO;
  vid.load();
}

function loadDefaultImage() {
  const img = new Image();
  img.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    hasMedia = true;
  };
  img.onerror = () => {
    console.log('No default media found, using built-in gradient.');
    hasMedia = false;
  };
  img.src = DEFAULT_BG_IMAGE;
}

tryLoadDefaultBg();

function loadImage(file) {
  const img = new Image();
  img.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.generateMipmap(gl.TEXTURE_2D);
    hasMedia=true; videoEl=null; showToast('BG UPDATED');
  };
  img.src = URL.createObjectURL(file);
}
function loadVideo(file) {
  if (videoEl) { videoEl.pause(); videoEl.src=''; }
  videoEl = document.createElement('video');
  videoEl.src = URL.createObjectURL(file);
  videoEl.loop=true; videoEl.muted=true; videoEl.playsInline=true;
  videoEl.play(); hasMedia=true; showToast('VIDEO BG LOADED');
}

function resize() {
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  gl.viewport(0,0,canvas.width,canvas.height);
}
window.addEventListener('resize', resize); resize();

const t0 = performance.now();
(function render() {
  const t = (performance.now()-t0)*0.001;
  if (videoEl && videoEl.readyState>=2) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,videoEl);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bgTex);
  gl.uniform1i(uLoc.bg,0); gl.uniform2f(uLoc.res,canvas.width,canvas.height);
  gl.uniform1f(uLoc.time,t); gl.uniform1f(uLoc.rain,params.rain);
  gl.uniform1f(uLoc.fog,params.fog); gl.uniform1f(uLoc.refr,params.refr);
  gl.uniform1i(uLoc.media,hasMedia?1:0);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  requestAnimationFrame(render);
})();

// ── 多条目日记管理 ─────────────────────────────────────────
// 存储结构: diary_entries = [ {date, text, drawing}, ... ]
// 当前指针: diary_idx

const STORE_KEY = 'rain_diary_entries';

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch(e) { return []; }
}
function saveEntries(entries) {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}

let entries = loadEntries();
let currentIdx = entries.length - 1;

function todayStr() {
  const d = new Date();
  return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');
}

// 如果没有任何条目，或最后一条不是今天，自动新建今天的条目
function ensureToday() {
  const today = todayStr();
  if (entries.length === 0 || entries[entries.length-1].date !== today) {
    entries.push({ date: today, text: '', drawing: null });
    saveEntries(entries);
    currentIdx = entries.length - 1;
  } else {
    currentIdx = entries.length - 1;
  }
}
ensureToday();

// ── UI 元素 ──
const ta        = document.getElementById('diaryContent');
const wcEl      = document.getElementById('diaryWc');
const dateEl    = document.getElementById('diaryDate');
const statusEl  = document.getElementById('saveStatus');
const drawCvs   = document.getElementById('drawCanvas');
const drawCtx   = drawCvs.getContext('2d');

// ── 渲染当前条目到 UI ──
const wk = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

// ── 条目指示器 ──────────────────────────────────────────
const MAX_DOTS = 9; // 最多显示几个点

function renderIndicator(idx, total) {
  const el = document.getElementById('entryIndicator');
  if (!el) return;
  el.innerHTML = '';

  if (total <= 1) {
    // 只有一条：只显示一个绿色胶囊
    const dot = document.createElement('span');
    dot.className = 'ei-dot active';
    el.appendChild(dot);
    return;
  }

  // 超过 MAX_DOTS 条时，用滑动窗口显示局部
  let start = 0, end = total;
  if (total > MAX_DOTS) {
    const half = Math.floor(MAX_DOTS / 2);
    start = Math.max(0, idx - half);
    end   = Math.min(total, start + MAX_DOTS);
    if (end === total) start = Math.max(0, end - MAX_DOTS);
  }

  for (let i = start; i < end; i++) {
    const dot = document.createElement('span');
    const dist = Math.abs(i - idx);
    if (i === idx) {
      dot.className = 'ei-dot active';
    } else if (dist === 1) {
      dot.className = 'ei-dot near';
    } else if (dist >= 3) {
      dot.className = 'ei-dot far';
    } else {
      dot.className = 'ei-dot';
    }
    // 点击跳转
    const target = i;
    dot.addEventListener('click', () => {
      currentIdx = target;
      renderEntry(currentIdx);
    });
    el.appendChild(dot);
  }
}

function renderEntry(idx) {
  const e = entries[idx];
  if (!e) return;
  // 日期显示
  const parts = e.date.split('.');
  const d = new Date(+parts[0], +parts[1]-1, +parts[2]);
  dateEl.textContent = wk[d.getDay()] + '  ' + e.date;
  // 标题
  const titleEl = document.getElementById('diaryTitle');
  titleEl.textContent = e.title || 'NEW ENTRY';
  // 文字
  ta.value = e.text || '';
  wcEl.textContent = (e.text||'').length + ' 字';
  // 绘图
  clearCanvas();
  if (e.drawing) {
    const img = new Image();
    img.onload = () => drawCtx.drawImage(img, 0, 0);
    img.src = e.drawing;
  }
  statusEl.textContent = '';
  // 前后按钮状态
  document.getElementById('btnPrev').style.opacity = idx > 0 ? '1' : '0.22';
  document.getElementById('btnNext').style.opacity = idx < entries.length-1 ? '1' : '0.22';
  // 指示器
  renderIndicator(idx, entries.length);
}
renderEntry(currentIdx);

// ── 自动保存（300ms 防抖） ──
let saveTimer = null;
function autoSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    entries[currentIdx].text = ta.value;
    saveEntries(entries);
    statusEl.textContent = 'SAVED';
    statusEl.classList.add('flash');
    setTimeout(()=>{ statusEl.textContent=''; statusEl.classList.remove('flash'); }, 1200);
  }, 300);
}
ta.addEventListener('input', () => {
  wcEl.textContent = ta.value.length + ' 字';
  autoSave();
});

// ── 标题可编辑 + 自动保存 ──
const titleEl = document.getElementById('diaryTitle');

// 回车直接跳到正文，不换行
titleEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    ta.focus();
  }
});

// 实时保存标题
titleEl.addEventListener('input', () => {
  const raw = titleEl.textContent.trim();
  entries[currentIdx].title = raw || '';
  saveEntries(entries);
  // 轻微 flash
  statusEl.textContent = 'SAVED';
  statusEl.classList.add('flash');
  clearTimeout(titleEl._st);
  titleEl._st = setTimeout(()=>{ statusEl.textContent=''; statusEl.classList.remove('flash'); }, 1000);
});

// 失焦时若为空恢复占位
titleEl.addEventListener('blur', () => {
  if (!titleEl.textContent.trim()) {
    titleEl.textContent = '';
  }
});

// ── 画布自动保存 ──
function saveDrawing() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    entries[currentIdx].drawing = drawCvs.toDataURL();
    saveEntries(entries);
    statusEl.textContent = 'SAVED';
    statusEl.classList.add('flash');
    setTimeout(()=>{ statusEl.textContent=''; statusEl.classList.remove('flash'); }, 1200);
  }, 500);
}

// ── 前/后翻页 ──
document.getElementById('btnPrev').addEventListener('click', () => {
  if (currentIdx > 0) { currentIdx--; renderEntry(currentIdx); }
});
document.getElementById('btnNext').addEventListener('click', () => {
  if (currentIdx < entries.length-1) { currentIdx++; renderEntry(currentIdx); }
});

// ── 新建条目 ──
document.getElementById('btnNew').addEventListener('click', () => {
  const today = todayStr();
  entries.push({ date: today, text: '', drawing: null });
  saveEntries(entries);
  currentIdx = entries.length - 1;
  renderEntry(currentIdx);
  showToast('NEW ENTRY');
  ta.focus();
});

// ── 删除确认 ──
const confirmMask = document.getElementById('confirmMask');
document.getElementById('btnDelete').addEventListener('click', () => {
  document.getElementById('confirmDesc').textContent = entries[currentIdx].date;
  confirmMask.classList.add('show');
});
document.getElementById('confirmCancel').addEventListener('click', () => confirmMask.classList.remove('show'));
document.getElementById('confirmOk').addEventListener('click', () => {
  entries.splice(currentIdx, 1);
  if (entries.length === 0) entries.push({ date: todayStr(), text:'', drawing:null });
  currentIdx = Math.min(currentIdx, entries.length-1);
  saveEntries(entries);
  confirmMask.classList.remove('show');
  renderEntry(currentIdx);
  showToast('DELETED');
});

// ── 效果控制面板（右上角 btnConfig 触发） ──
const ctrlPanel  = document.getElementById('ctrlPanel');
const btnConfig  = document.getElementById('btnConfig');
btnConfig.addEventListener('click', e => {
  e.stopPropagation();
  const open = ctrlPanel.classList.toggle('open');
  btnConfig.classList.toggle('panel-open', open);
});
document.addEventListener('click', e => {
  if (!ctrlPanel.contains(e.target) && e.target.id !== 'btnConfig' && !btnConfig.contains(e.target)) {
    ctrlPanel.classList.remove('open');
    btnConfig.classList.remove('panel-open');
  }
});
function bindSlider(id, vid, key, div) {
  const el=document.getElementById(id), vEl=document.getElementById(vid);
  el.addEventListener('input',()=>{ params[key]=el.value/div; vEl.textContent=el.value; });
}
bindSlider('sliderRain','valRain','rain',100);
bindSlider('sliderFog','valFog','fog',100);
bindSlider('sliderRefr','valRefr','refr',100);

// ── 背景上传 / 重置 ──
const mediaInput = document.getElementById('mediaInput');
document.getElementById('uploadBtn').addEventListener('click',()=>{ mediaInput.click(); });
mediaInput.addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  if(f.type.startsWith('image/')) loadImage(f);
  else if(f.type.startsWith('video/')) loadVideo(f);
  mediaInput.value='';
});
function resetBg() {
  if(videoEl){videoEl.pause();videoEl.src='';videoEl=null;}
  hasMedia=false; showToast('BG RESET');
}
document.getElementById('resetBtn').addEventListener('click', resetBg);
// 预览按钮（切换隐藏日记卡片，纯沉浸背景）
document.getElementById('btnPreview').addEventListener('click', () => {
  const wrapper = document.querySelector('.diary-wrapper');
  const hidden = wrapper.style.opacity === '0';
  wrapper.style.opacity = hidden ? '1' : '0';
  wrapper.style.pointerEvents = hidden ? '' : 'none';
  document.getElementById('btnPreview').classList.toggle('panel-open', !hidden);
});

// ── 画笔模式 ─────────────────────────────────────────────
let penMode = false;
let penColor = '#ffffff';
let penSize  = 4;
let eraseMode = false;
let drawing  = false;
let lastX = 0, lastY = 0;

const penToolbar = document.getElementById('penToolbar');

function resizeDrawCanvas() {
  // 保存内容再 resize
  const img = drawCvs.toDataURL();
  drawCvs.width  = drawCvs.offsetWidth;
  drawCvs.height = drawCvs.offsetHeight;
  if (entries[currentIdx] && entries[currentIdx].drawing) {
    const i = new Image(); i.onload=()=>drawCtx.drawImage(i,0,0); i.src=entries[currentIdx].drawing;
  }
}
function clearCanvas() {
  drawCvs.width  = drawCvs.offsetWidth  || 520;
  drawCvs.height = drawCvs.offsetHeight || 280;
  drawCtx.clearRect(0,0,drawCvs.width,drawCvs.height);
}

function getPos(e) {
  const r = drawCvs.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - r.left, y: src.clientY - r.top };
}

drawCvs.addEventListener('pointerdown', e => {
  if (!penMode) return;
  drawing = true;
  const p = getPos(e);
  lastX = p.x; lastY = p.y;
  drawCtx.beginPath();
  drawCtx.moveTo(lastX, lastY);
});
drawCvs.addEventListener('pointermove', e => {
  if (!penMode || !drawing) return;
  const p = getPos(e);
  drawCtx.lineWidth   = eraseMode ? penSize*4 : penSize;
  drawCtx.strokeStyle = eraseMode ? 'rgba(0,0,0,1)' : penColor;
  drawCtx.lineCap     = 'round';
  drawCtx.lineJoin    = 'round';
  drawCtx.globalCompositeOperation = eraseMode ? 'destination-out' : 'source-over';
  drawCtx.lineTo(p.x, p.y);
  drawCtx.stroke();
  drawCtx.beginPath();
  drawCtx.moveTo(p.x, p.y);
  lastX = p.x; lastY = p.y;
  saveDrawing();
});
drawCvs.addEventListener('pointerup',   () => { drawing=false; drawCtx.beginPath(); });
drawCvs.addEventListener('pointerleave',() => { drawing=false; drawCtx.beginPath(); });

document.getElementById('btnPen').addEventListener('click', () => {
  penMode = !penMode;
  const btnPen = document.getElementById('btnPen');
  if (penMode) {
    ta.style.display = 'none';
    drawCvs.style.display = 'block';
    resizeDrawCanvas();
    penToolbar.classList.add('open');
    btnPen.classList.add('on');
    showToast('PEN MODE');
  } else {
    ta.style.display = 'block';
    drawCvs.style.display = 'none';
    penToolbar.classList.remove('open');
    btnPen.classList.remove('on');
    eraseMode = false;
    showToast('TEXT MODE');
  }
});

document.getElementById('penColor').addEventListener('input', e => { penColor = e.target.value; eraseMode=false; });
document.getElementById('penSize').addEventListener('input',  e => { penSize  = +e.target.value; });
document.getElementById('penErase').addEventListener('click', () => {
  eraseMode = !eraseMode;
  document.getElementById('penErase').style.color = eraseMode ? 'rgba(80,220,160,0.9)' : '';
});
document.getElementById('penClear').addEventListener('click', () => {
  clearCanvas();
  entries[currentIdx].drawing = null;
  saveEntries(entries);
});

// ── 雨声音频（外部文件） ────────────────────────────────────
// 将你的雨声音频文件放在同目录下，命名为 rain-sound.mp3（或 .ogg / .wav）
// 文件不存在时点击音量按钮会静默失败，不影响其他功能
const RAIN_AUDIO_SRC = 'rain-sound.mp3';

let audioEl = null;   // <audio> 元素
let soundOn = false;

function getVol() {
  return document.getElementById('sliderVol').value / 100;
}

function initAudio() {
  if (audioEl) return;
  audioEl = new Audio(RAIN_AUDIO_SRC);
  audioEl.loop   = true;
  audioEl.volume = getVol();
  audioEl.onerror = () => {
    showToast('AUDIO FILE NOT FOUND');
    soundOn = false;
    document.getElementById('btnSound').classList.remove('on');
    audioEl = null;
  };
}

document.getElementById('btnSound').addEventListener('click', () => {
  if (!soundOn) {
    initAudio();
    if (!audioEl) return;
    audioEl.volume = getVol();
    audioEl.play().catch(() => showToast('AUDIO BLOCKED'));
    soundOn = true;
    document.getElementById('btnSound').classList.add('on');
    showToast('RAIN SOUND ON');
  } else {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    soundOn = false;
    document.getElementById('btnSound').classList.remove('on');
    showToast('RAIN SOUND OFF');
  }
});

document.getElementById('sliderVol').addEventListener('input', e => {
  document.getElementById('valVol').textContent = e.target.value;
  if (audioEl) audioEl.volume = getVol();
});

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2000);
}
