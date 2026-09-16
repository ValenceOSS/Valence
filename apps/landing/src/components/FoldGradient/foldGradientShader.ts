export const fragmentShader = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;

uniform vec4  u_colors[5];
uniform float u_ncols;
uniform vec3  u_back;
uniform vec3  u_shadow;
uniform float u_softness;
uniform float u_saturation;
uniform float u_noise;
uniform float u_rotation;
uniform float u_folds;
uniform float u_ribbon;
uniform float u_ribbonWidth;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=mix(mix(hash12(ip),          hash12(ip+vec2(1,0)), u.x),
              mix(hash12(ip+vec2(0,1)), hash12(ip+vec2(1,1)), u.x), u.y);
  return r*r;
}
const mat2 m2=mat2(0.8,-0.6,0.6,0.8);
float fbm(vec2 p){
  float f=0.0;
  f+=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;
}
float pat(vec2 p, out float hue){
  vec2 q=vec2(fbm(p), fbm(p+vec2(5.2,1.3)));
  vec2 r=vec2(fbm(p+4.0*q+vec2(1.7,9.2)), fbm(p+4.0*q+vec2(8.3,2.8)));
  hue=clamp(r.x*0.95+0.03, 0.0, 1.0);
  r+=u_time*0.045;
  return fbm(p+1.76*r);
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}
float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec2 dir=normalize(vec2(0.66,0.75));
  vec2 perp=vec2(-dir.y,dir.x);
  float sm=0.045+(2.0-u_softness)*0.075;
  float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;

  float asp=u_resolution.x/u_resolution.y;
  mat2  R=rot(radians(u_rotation));
  float zsc=29.16/u_folds;
  vec2  pBase=vec2((uv.x-0.5)*asp, uv.y-0.5)*R*zsc;
  vec2  wDir =vec2(dir.x*asp,  dir.y )*R*zsc;
  vec2  wPerp=vec2(perp.x*asp, perp.y)*R*zsc;

  float bandGain=1.0;
  if(u_ribbon>0.001){
    float d=dot(pBase, normalize(vec2(wPerp)))/3.24;
    float t=d/(0.16*max(u_ribbonWidth,0.05));
    t+=0.35*sin(t*1.7+2.1);
    float band=floor(t), fb=fract(t);
    float k=smoothstep(0.0,0.16,fb);
    float bA=band-1.0, bB=band;
    float s=dot(pBase, normalize(vec2(wDir)))/3.24;
    float shear=mix(hash12(vec2(bA,7.7)), hash12(vec2(bB,7.7)), k);
    pBase+=normalize(wDir)*(shear-0.5)*4.5*u_ribbon;
    float c =mix(hash12(vec2(bA,9.1)), hash12(vec2(bB,9.1)), k)-0.5;
    float hl=0.42+0.40*mix(hash12(vec2(bA,11.3)), hash12(vec2(bB,11.3)), k);
    float cap=1.0-smoothstep(hl-0.24, hl+0.14, abs(s-c*0.8));
    float e=mix(hash12(vec2(bA,3.3)), hash12(vec2(bB,3.3)), k);
    bandGain=mix(1.0, (0.62+1.25*e*e)*cap*1.3, u_ribbon);
    float fo=mix(hash12(vec2(bA,5.5)), hash12(vec2(bB,5.5)), k);
    sm*=mix(1.0, 0.70+1.25*fo, u_ribbon);
  }

  vec3 L=normalize(vec3(0.55,0.35,0.55));
  vec3 HL=normalize(L+vec3(0.0,0.0,1.0));

  float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;
  const int K=6;
  float fscale=mix(1.0, 0.52, clamp(u_ribbon,0.0,1.0));
  for(int i=-K;i<=K;i++){
    float fi=(float(i)+jit)/float(K);
    float w=exp(-fi*fi*2.5);
    vec2 off=wDir*(fi*sm)+wPerp*(fi*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);
    vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    vec3 N=normalize(vec3(-g, 0.5));
    float diff=clamp(dot(N,L),0.0,1.0);
    float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float sheen =pow(h,5.0)*0.45*u_ribbon;
    float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);
    lum+=lv*w; hue+=hh*w; wsum+=w;
    bloom+=smoothstep(0.55,1.0,lv)*w;
  }
  lum/=wsum; hue/=wsum; bloom/=wsum;
  lum*=bandGain;

  vec2 qc=(uv-0.5); qc.x*=asp; lum*=1.0-dot(qc,qc)*0.45;

  vec3 grad=palette(hue*0.62 + lum*0.42);
  vec3 col=mix(u_back, u_shadow, smoothstep(0.015,0.30,lum));
  col=mix(col, grad, smoothstep(0.22,0.72,lum));
  col+=grad*bloom*0.55;

  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation), 0.0, 1.0);

  float lvl=mix(255.0, 14.0, clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col=floor(col*lvl+0.5)/lvl;

  fragColor=vec4(col,1.0);
}
`;

export const DEFAULT_FOLD_GRADIENT_COLORS = ['#700000', '#008cff', '#75daff', '#ff0026', '#ff3626'];

export const DEFAULT_FOLD_GRADIENT_BACKGROUND = '#121212';

export const DEFAULT_FOLD_GRADIENT_SHADOW = '#0a1c2a';
