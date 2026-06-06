window.VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

window.FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uBg;
uniform vec2 uRes;
uniform float uTime, uRain, uFog, uRefr;
uniform int uHasMedia;
in vec2 vUV;
out vec4 outColor;

vec3 N13(float p) {
  vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3((p3.x+p3.y)*p3.z,(p3.x+p3.z)*p3.y,(p3.y+p3.z)*p3.x));
}
float N(float t) { return fract(sin(t*12345.564)*7658.76); }
float Saw(float b, float t) { return smoothstep(0.,b,t)*smoothstep(1.,b,t); }

vec2 DropLayer2(vec2 uv, float t) {
  vec2 UV = uv;
  uv.y += t * 0.75;
  vec2 a = vec2(6.,1.), grid = a*2., id = floor(uv*grid);
  uv.y += N(id.x);
  id = floor(uv*grid);
  vec3 n = N13(id.x*35.2+id.y*2376.1);
  vec2 st = fract(uv*grid)-vec2(.5,0.);
  float x = n.x-.5;
  float y = UV.y*20.;
  x += sin(y+sin(y))*(.5-abs(x))*(n.z-.5);
  x *= .7;
  y = (Saw(.85,fract(t+n.z))-.5)*.9+.5;
  vec2 p = vec2(x,y);
  float d = length((st-p)*a.yx);
  float mainDrop = smoothstep(.4,.0,d);
  float r = sqrt(smoothstep(1.,y,st.y));
  float cd = abs(st.x-x);
  float trail = smoothstep(.23*r,.15*r*r,cd)*smoothstep(-.02,.02,st.y-y)*r*r;
  float dd = length(st-vec2(x, fract(y*10.)+(st.y-.5)));
  float m = mainDrop + smoothstep(.3,0.,dd)*r*smoothstep(-.02,.02,st.y-y);
  return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
  uv *= 40.;
  vec2 id = floor(uv);
  uv = fract(uv)-.5;
  vec3 n = N13(id.x*107.45+id.y*3543.654);
  float d = length(uv-(n.xy-.5)*.7);
  return smoothstep(.3,0.,d)*fract(n.z*10.)*Saw(.025,fract(t+n.z));
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
  float s = StaticDrops(uv,t)*l0;
  vec2 m1 = DropLayer2(uv,t)*l1;
  vec2 m2 = DropLayer2(uv*1.85,t)*l2;
  float c = smoothstep(.3,1.,s+m1.x+m2.x);
  return vec2(c, max(m1.y*l0,m2.y*l1));
}

vec3 gradBG(vec2 uv, float t) {
  float w1 = sin(uv.x*2.8+t*.25)*sin(uv.y*2.1+t*.18)*.5+.5;
  float w2 = sin(uv.x*1.4-t*.15+uv.y*1.8)*.5+.5;
  return mix(mix(vec3(.04,.07,.20),vec3(.18,.04,.22),w1),vec3(.02,.13,.25),w2*.45);
}

void main() {
  vec2 uv = (vUV-.5)*vec2(uRes.x/uRes.y,1.);
  vec2 UV = vUV;
  float t = uTime*.2;
  float sD = smoothstep(-.5,1.,uRain)*2.;
  float l1 = smoothstep(.25,.75,uRain);
  float l2 = smoothstep(.0,.5,uRain);
  vec2 c = Drops(uv,t,sD,l1,l2);
  vec2 e = vec2(.001,0.);
  vec2 n = vec2(Drops(uv+e,t,sD,l1,l2).x-c.x, Drops(uv+e.yx,t,sD,l1,l2).x-c.x)*uRefr;
  float fMin = mix(1.5,3.5,uFog), fMax = mix(3.5,7.5,uFog);
  float focus = mix(fMax-c.y, fMin, smoothstep(.1,.2,c.x));
  vec3 col;
  if (uHasMedia==1) {
    col = textureLod(uBg, UV+n, focus).rgb;
  } else {
    vec2 b = UV+n; float bv = focus*.035;
    col = (gradBG(b,uTime)+gradBG(b+vec2(bv,0.),uTime)*.25+gradBG(b-vec2(bv,0.),uTime)*.25
          +gradBG(b+vec2(0.,bv),uTime)*.25+gradBG(b-vec2(0.,bv),uTime)*.25)/2.;
  }
  col *= mix(vec3(1.),vec3(.88,.94,1.22),(sin(uTime*.1)*.5+.5)*.35);
  vec2 vg = UV-.5; col *= 1.-dot(vg,vg)*1.1;
  col += length(n)*5.*uRain*vec3(.7,.85,1.)*.22;
  outColor = vec4(clamp(col,0.,1.),1.);
}`;
