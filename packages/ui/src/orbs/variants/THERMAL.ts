import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const THERMAL: OrbVariant = {
  key: 'thermal',
  label: 'Thermal',
  shader: `
const float PI = 3.14159265359;
float heatGainNow;
float heatJitterNow;
float grainNoise(vec2 gpix, float frame, float seed) {
  return hash(gpix + vec2(frame * 13.71 + seed, frame * 7.37 - seed));
}
mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
float screen(vec2 uv, float a, vec2 o, float coverage, float soft) {
  vec2 cell = rot2(a) * uv * uP_dots + o;
  vec2 f = fract(cell) - 0.5;
  float d = length(f);
  float size = 0.5 * sqrt(clamp(coverage * uP_dotGain, 0.0, 1.0));
  return 1.0 - smoothstep(size - soft, size + soft, d);
}
void main() {
  heatGainNow = uP_gain * (1.0 + 0.6 * uOutput);
  heatJitterNow = uP_jitter * (1.0 + 1.5 * uInput);
  vec2 uv = orbUV();
  float rd = length(uv);
  float R = uP_radius;
  float mask = smoothstep(0.012, -0.012, rd - R);
  if (mask <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec2 pl = uv / R;
  float r2 = dot(pl, pl);
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vec3(pl, z);
  float cr = cos(uP_spin);
  float sr = sin(uP_spin);
  vec3 sp = vec3(n.x * cr - n.z * sr, n.y, n.x * sr + n.z * cr);
  float t = uP_speed;
  vec2 st = sp.xy / (1.3 + sp.z) * uP_scale;
  vec2 p = st * uP_freq + vec2(t * 0.11, -t * 0.07);
  vec2 wp = st * uP_freq * 0.55 + vec2(-t * 0.05, t * 0.08);
  vec2 warp = vec2(noise(wp + 3.1), noise(wp + 9.4)) - 0.5;
  p += warp * uP_warp;
  p += vec2(sin(t * 3.7), cos(t * 4.3)) * heatJitterNow;
  float field = noise(p) * 0.62 + noise(p * 2.1 + 5.3) * 0.26 + noise(p * 4.2 + 1.7) * 0.12;
  float heat = clamp((field - uP_lo) * heatGainNow / max(uP_hi - uP_lo, 0.01), 0.0, 1.0);
  vec2 gpix = floor(gl_FragCoord.xy / max(uP_grainSize, 1.0));
  float frame = floor(uTime * 48.0);
  heat += (grainNoise(gpix, frame, 3.1) - 0.5) * uP_dither;
  float banded = floor(heat * uP_bands + 0.5) / uP_bands;
  heat = clamp(mix(heat, banded, uP_banding), 0.0, 1.0);
  heat = pow(heat, uP_contrast);
  vec3 base = mix(uC_cold, uC_cool, smoothstep(0.0, 0.3, heat));
  base = mix(base, uC_warm, smoothstep(0.3, 0.55, heat));
  base = mix(base, uC_hot, smoothstep(0.55, 0.78, heat));
  base = mix(base, uC_core, smoothstep(0.78, 0.97, heat));
  float soft = uP_dotSoft;
  float mis = uP_misregister;
  float cC = screen(uv, 0.035 * mis, vec2(0.22, 0.12) * mis, 1.0 - base.r, soft);
  float cM = screen(uv, -0.03 * mis, vec2(-0.14, 0.2) * mis, 1.0 - base.g, soft);
  float cY = screen(uv, 0.0, vec2(0.0), 1.0 - base.b, soft);
  vec3 print = uC_paper;
  print *= mix(vec3(1.0), vec3(0.05, 0.62, 0.92), cC * uP_ink);
  print *= mix(vec3(1.0), vec3(0.92, 0.08, 0.48), cM * uP_ink);
  print *= mix(vec3(1.0), vec3(0.98, 0.86, 0.02), cY * uP_ink);
  vec3 col = mix(base, print, uP_printMix);
  col *= 1.0 + (grainNoise(gpix, frame, 27.9) - 0.5) * uP_grain;
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  col *= 1.0 - uP_light * (1.0 - lambert);
  float fres = pow(1.0 - z, 2.5);
  col += uC_paper * uP_rim * fres * 0.5;
  float a = mask;
  gl_FragColor = vec4(max(col, vec3(0.0)) * a, a);
}
`,
  params: [
    { key: 'speed', label: 'Drift', min: 0.015, max: 10, step: 0.05, standard: 0.5, isRate: true },
    { key: 'spin', label: 'Roll', min: 0, max: 5, step: 0.03, standard: 0.05, isRate: true },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'scale', label: 'Zoom', min: 0.3, max: 8, step: 0.05, standard: 3 },
    { key: 'freq', label: 'Pool scale', min: 0.2, max: 6, step: 0.05, standard: 1.4 },
    { key: 'warp', label: 'Warp', min: 0, max: 3, step: 0.02, standard: 0.6 },
    { key: 'lo', label: 'Cold threshold', min: 0, max: 1, step: 0.005, standard: 0.42 },
    { key: 'hi', label: 'Hot threshold', min: 0, max: 1, step: 0.005, standard: 0.74 },
    { key: 'gain', label: 'Heat gain', min: 0.1, max: 6, step: 0.02, standard: 1 },
    { key: 'jitter', label: 'Heat jitter', min: 0, max: 0.5, step: 0.005, standard: 0.015 },
    { key: 'bands', label: 'Contour bands', min: 2, max: 24, step: 1, standard: 7 },
    { key: 'banding', label: 'Contour strength', min: 0, max: 1, step: 0.01, standard: 0.85 },
    { key: 'contrast', label: 'Contrast', min: 0.3, max: 3, step: 0.02, standard: 1 },
    { key: 'dither', label: 'Dither', min: 0, max: 0.6, step: 0.005, standard: 0.05 },
    { key: 'dots', label: 'Screen pitch', min: 4, max: 120, step: 1, standard: 46 },
    { key: 'dotGain', label: 'Dot gain', min: 0.2, max: 2, step: 0.01, standard: 1 },
    { key: 'dotSoft', label: 'Dot softness', min: 0.01, max: 0.3, step: 0.005, standard: 0.12 },
    { key: 'misregister', label: 'Misregistration', min: 0, max: 3, step: 0.02, standard: 0.5 },
    { key: 'ink', label: 'Ink density', min: 0, max: 1, step: 0.01, standard: 0.92 },
    { key: 'printMix', label: 'Print mix', min: 0, max: 1, step: 0.01, standard: 0.28 },
    { key: 'grain', label: 'Paper grain', min: 0, max: 2, step: 0.01, standard: 0.35 },
    { key: 'grainSize', label: 'Grain size', min: 1, max: 8, step: 1, standard: 2 },
    { key: 'light', label: 'Key light', min: 0, max: 1, step: 0.01, standard: 0.25 },
    { key: 'rim', label: 'Rim light', min: 0, max: 3, step: 0.015, standard: 0.25 },
  ],
  colours: [
    { key: 'cold', label: 'Cold', standard: '#0b0a1e' },
    { key: 'cool', label: 'Cool', standard: '#3b2a9a' },
    { key: 'warm', label: 'Warm', standard: '#f05a28' },
    { key: 'hot', label: 'Hot', standard: '#f6b53a' },
    { key: 'core', label: 'Core', standard: '#fff1e6' },
    { key: 'paper', label: 'Paper', standard: '#f4ecdf' },
  ],
};

export { THERMAL };
