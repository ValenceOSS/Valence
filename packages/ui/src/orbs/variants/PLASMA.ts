import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const PLASMA: OrbVariant = {
  key: 'plasma',
  label: 'Plasma',
  shader: `
#define STEPS 64
float ionSharp;
float ionWrithe;
float ionCore;
float ionExposure;
float ionRadius;
mat2 ionRot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
vec3 ionRender(vec2 fragCoord) {
  float t = uP_speed;
  float spinAng = uP_spin;
  vec2 uv = (2.0 * fragCoord - uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, uP_camDist);
  vec3 rd = normalize(vec3(uv, -uP_focal));
  float proj = dot(-ro, rd);
  float b2 = dot(ro, ro) - proj * proj;
  float half_ = sqrt(max(ionRadius * ionRadius - b2, 0.0));
  float zNear = proj - half_;
  float stepLen = 2.0 * half_ / float(STEPS);
  zNear += (hash(fragCoord) - 0.5) * stepLen;
  vec3 acc = vec3(0.0);
  float T = 1.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * (zNear + (float(i) + 0.5) * stepLen);
    vec3 pr = p;
    pr.xz = ionRot2(spinAng) * pr.xz;
    pr.yz = ionRot2(uP_tilt) * pr.yz;
    float r = length(pr);
    vec3 dir = pr / max(r, 1e-4);
    float rr = r / max(ionRadius, 1e-3);
    float wr = ionWrithe * smoothstep(0.0, ionRadius * 0.35, r);
    vec3 q = dir * uP_fils;
    q += wr * vec3(
      sin(r * uP_writheFreq        - t * 1.2 + q.y * 1.8),
      sin(r * uP_writheFreq * 0.83 + t * 1.0 + q.z * 1.8),
      sin(r * uP_writheFreq * 1.19 - t * 0.7 + q.x * 1.8));
    float f1 = sin(q.x + t * 0.70)
             + sin(q.y * 1.31 - t * 0.50)
             + sin(q.z * 1.13 + t * 0.90);
    float f2 = sin(q.y * 1.21 + t * 0.60 + 1.7)
             + sin(q.z * 1.43 - t * 0.80 + 3.1)
             + sin(q.x * 0.87 + t * 0.40 + 5.0);
    float d2 = f1 * f1 + f2 * f2;
    float g = 1.0 / (d2 * ionSharp + uP_soft);
    g *= 1.0 + uP_tipGain * smoothstep(0.55, 0.95, rr);
    float core = ionCore / (r * r * 8.0 + 0.05);
    vec3 fCol = mix(uC_inner, uC_arc, smoothstep(0.1, 0.75, rr));
    vec3 w = (fCol + vec3(uP_whiten) * g) * g + uC_inner * core + vec3(uP_fill);
    w = min(w, vec3(uP_stepClamp));
    w *= stepLen;
    acc += T * w;
    T *= exp(-dot(w, vec3(0.299, 0.587, 0.114)) * uP_scatter);
    if (T < 0.004) break;
  }
  return acc;
}
void main() {
  ionSharp = uP_sharp * (1.0 - 0.25 * uOutput);
  ionWrithe = uP_writhe * (1.0 + 0.6 * uOutput);
  ionCore = uP_coreGain * (1.0 + 1.6 * uInput + 0.4 * uOutput);
  ionExposure = uP_exposure * (1.0 - 0.35 * uOutput);
  ionRadius = uP_envRadius + uP_swell * uInput;
  vec3 acc = ionRender(gl_FragCoord.xy);
  vec3 col = tanh3(acc / max(ionExposure, 0.01));
  col = pow(clamp(col, 0.0, 1.0), vec3(uP_contrast));
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uP_saturation);
  col *= uC_tint;
  float peak = max(col.r, max(col.g, col.b));
  float a = clamp(peak * uP_alphaGain, 0.0, 1.0);
  vec3 mrd = normalize(vec3(orbUV(), -uP_focal));
  float closest = length(cross(vec3(0.0, 0.0, uP_camDist), mrd));
  float band = mix(0.35, 0.012, clamp(uP_edge, 0.0, 1.0));
  float mask = 1.0 - smoothstep(ionRadius * (1.0 - band), ionRadius * 1.005, closest);
  col *= mask;
  a *= mask;
  gl_FragColor = vec4(col, a);
}
`,
  params: [
    {
      key: 'speed',
      label: 'Anim speed',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 1,
      isRate: true,
    },
    { key: 'spin', label: 'Spin rate', min: 0, max: 5, step: 0.03, standard: 0.2, isRate: true },
    { key: 'camDist', label: 'Camera distance', min: 1, max: 50, step: 0.3, standard: 7 },
    { key: 'focal', label: 'Lens', min: 0.15, max: 15, step: 0.1, standard: 2.25 },
    { key: 'envRadius', label: 'Globe radius', min: 0.15, max: 15, step: 0.1, standard: 2.6 },
    { key: 'swell', label: 'Input swell', min: 0, max: 1, step: 0.01, standard: 0.15 },
    { key: 'tilt', label: 'Axis tilt', min: 0, max: 4, step: 0.02, standard: 0.4 },
    { key: 'fils', label: 'Filament density', min: 0.5, max: 12, step: 0.1, standard: 6 },
    { key: 'writhe', label: 'Writhe', min: 0, max: 3, step: 0.02, standard: 0.9 },
    { key: 'writheFreq', label: 'Writhe frequency', min: 0.2, max: 8, step: 0.05, standard: 1.6 },
    { key: 'sharp', label: 'Arc sharpness', min: 0.5, max: 60, step: 0.5, standard: 4 },
    { key: 'soft', label: 'Arc core softness', min: 0.002, max: 0.5, step: 0.002, standard: 0.06 },
    { key: 'whiten', label: 'Core whitening', min: 0, max: 0.2, step: 0.002, standard: 0.008 },
    { key: 'coreGain', label: 'Nucleus glow', min: 0, max: 5, step: 0.05, standard: 1.6 },
    { key: 'tipGain', label: 'Glass flare', min: 0, max: 6, step: 0.05, standard: 1.8 },
    { key: 'fill', label: 'Body haze', min: 0, max: 2, step: 0.01, standard: 0.02 },
    { key: 'stepClamp', label: 'Step clamp', min: 0.3, max: 300, step: 1.5, standard: 40 },
    { key: 'scatter', label: 'Diffusion', min: 0, max: 0.5, step: 0.003, standard: 0.012 },
    { key: 'exposure', label: 'Exposure', min: 0.1, max: 200, step: 0.5, standard: 11 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 15, step: 0.1, standard: 1 },
    { key: 'saturation', label: 'Saturation', min: 0, max: 4, step: 0.02, standard: 1.2 },
    { key: 'alphaGain', label: 'Alpha gain', min: 0.05, max: 15, step: 0.1, standard: 2.5 },
    { key: 'edge', label: 'Edge sharpness', min: 0, max: 1, step: 0.01, standard: 1 },
  ],
  colours: [
    { key: 'inner', label: 'Nucleus', standard: '#ff70d8' },
    { key: 'arc', label: 'Arc', standard: '#5a5cff' },
    { key: 'tint', label: 'Tint', standard: '#ffffff' },
  ],
};

export { PLASMA };
