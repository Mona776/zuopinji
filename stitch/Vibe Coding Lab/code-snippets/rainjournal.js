// rijiben-scpr.vercel.app — shader.js + main.js (excerpt)
window.VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
const prog = gl.createProgram();
// ... compile VERT_SRC / FRAG_SRC, link program

const params = { rain: 0.70, fog: 0.30, refr: 0.60 };
const DEFAULT_BG_VIDEO = 'default-bg.mp4';

function tryLoadDefaultBg() {
  const vid = document.createElement('video');
  vid.loop = true;
  vid.muted = true;
  vid.playsInline = true;
  vid.src = DEFAULT_BG_VIDEO;
  vid.addEventListener('canplaythrough', () => {
    vid.play().then(() => { videoEl = vid; hasMedia = true; });
  }, { once: true });
  vid.load();
}

// render loop: rain drops + refraction on background texture
(function render() {
  const t = (performance.now() - t0) * 0.001;
  gl.uniform1f(uLoc.rain, params.rain);
  gl.uniform1f(uLoc.fog, params.fog);
  gl.uniform1f(uLoc.refr, params.refr);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
})();

// diary entries → localStorage
const STORE_KEY = 'rain_diary_entries';
function saveEntries(entries) {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}
