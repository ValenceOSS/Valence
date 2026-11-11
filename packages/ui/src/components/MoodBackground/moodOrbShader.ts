// oxlint-disable-next-line valence/no-hard-coded-strings -- GLSL source the GPU compiles, not words anyone reads
export const moodOrbShader = `#version 300 es
precision mediump float;
precision highp int;

uniform float u_time;
uniform vec2  u_resolution;

uniform highp vec4 u_orbs[24];
uniform float u_reach;
uniform float u_drift;

out vec4 fragColor;

float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  uv.y=1.0-uv.y;
  vec3 light=normalize(vec3(-0.45,-0.55,0.7));
  vec3 colour=vec3(0.0);
  float cover=0.0;

  for(int i=0;i<24;i++){
    highp vec4 orb=u_orbs[i];
    if(orb.z<=0.001){ continue; }
    float f=float(i);
    vec2 wander=u_drift*vec2(
      sin(u_time*(0.11+0.013*f)+f*1.37)*0.09,
      cos(u_time*(0.08+0.011*f)+f*2.11)*0.07
    );
    vec2 offset=(uv-(orb.xy+wander))/vec2(u_reach, u_reach*0.9);
    float reach=dot(offset,offset);
    if(reach>4.0){ continue; }
    float glow=exp(-reach*3.2);
    vec3 normal=normalize(vec3(offset, sqrt(max(1.0-min(reach,1.0),0.0))+0.35));
    float shade=0.82+0.36*max(dot(normal,light),0.0);
    float a=clamp(orb.z*glow*shade,0.0,1.0);
    highp float packed=orb.w;
    vec3 tint=vec3(floor(packed/65536.0), floor(mod(packed,65536.0)/256.0), mod(packed,256.0))/255.0;
    tint=pow(tint,vec3(2.2));
    colour=colour*(1.0-a)+tint*a;
    cover=cover*(1.0-a)+a;
  }

  vec3 shown=cover>0.0 ? pow(colour/cover,vec3(1.0/2.2))*cover : vec3(0.0);
  float grain=(hash12(gl_FragCoord.xy)-0.5)/255.0;
  fragColor=vec4(shown+grain*cover, cover);
}
`;
