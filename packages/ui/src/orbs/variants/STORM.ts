import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const STORM: OrbVariant = {
  key: 'storm',
  label: 'Storm',
  shader: `
const float PI = 3.14159265359;
float grainNoise(vec2 gpix, float frame, float seed) {
  return hash(gpix + vec2(frame * 13.71 + seed, frame * 7.37 - seed));
}
void main() {
  float warpNow = uP_warp * (1.0 + 0.55 * uInput);
  float gainNow = uP_gain * (0.85 + 0.45 * uOutput);
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
  st.x -= t * 0.3;
  st.x += uP_shear * sin(sp.y * uP_bands - t * 0.45);
  vec2 q = vec2(
    fbm(st + vec2(0.0, t * 0.35)),
    fbm(st + vec2(5.2, 1.3) - vec2(t * 0.28, 0.0))
  );
  vec2 w = vec2(
    fbm(st + warpNow * q + vec2(1.7, 9.2) + vec2(t * 0.12, 0.0)),
    fbm(st + warpNow * q + vec2(8.3, 2.8) - vec2(0.0, t * 0.1))
  );
  float f = fbm(st + uP_churn * w);
  vec2 gpix = floor(gl_FragCoord.xy / max(uP_grainSize, 1.0));
  float frame = floor(uTime * 48.0);
  float g1 = grainNoise(gpix, frame, 3.1);
  f += (g1 - 0.5) * uP_grain;
  f = pow(clamp(f * gainNow, 0.0, 1.0), uP_contrast);
  vec3 col = mix(uC_deep, uC_low, smoothstep(0.05, 0.35, f));
  col = mix(col, uC_mid, smoothstep(0.35, 0.62, f));
  col = mix(col, uC_hot, smoothstep(0.62, 0.88, f));
  vec3 shimmer = 0.5 + 0.5 * cos(2.0 * PI * (f * 0.9 + q.x * 1.1 + t * 0.06 + vec3(0.0, 0.33, 0.67)));
  col = mix(col, col * (0.35 + 1.9 * shimmer), uP_rainbow);
  float ft = t * uP_flashRate;
  float gate = step(1.0 - (0.1 + 0.5 * uOutput), hash(vec2(floor(ft), 7.7)));
  float flashEnv = gate * exp(-fract(ft) * 6.0);
  float high = smoothstep(0.55, 0.95, f);
  col += uC_flash * (flashEnv * uP_flash) * (0.06 + 0.94 * high * high);
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  col *= 0.35 + uP_light * lambert;
  float fres = pow(1.0 - z, 2.5);
  col += uC_flash * uP_rim * fres * (0.4 + 0.35 * flashEnv);
  float g2 = grainNoise(gpix, frame, 27.9);
  col *= 1.0 + (g2 - 0.5) * uP_filmGrain;
  float a = mask;
  gl_FragColor = vec4(max(col, vec3(0.0)) * a, a);
}
`,
  params: [
    {
      key: 'speed',
      label: 'Storm speed',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 0.9,
      isRate: true,
    },
    { key: 'spin', label: 'Roll', min: 0, max: 5, step: 0.03, standard: 0.12, isRate: true },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'scale', label: 'Weather scale', min: 0.3, max: 12, step: 0.1, standard: 2.4 },
    { key: 'bands', label: 'Band count', min: 0, max: 20, step: 0.1, standard: 6 },
    { key: 'shear', label: 'Band shear', min: 0, max: 5, step: 0.03, standard: 1.1 },
    { key: 'warp', label: 'Warp', min: 0, max: 8, step: 0.05, standard: 2.2 },
    { key: 'churn', label: 'Churn', min: 0, max: 8, step: 0.05, standard: 1.4 },
    { key: 'gain', label: 'Brightness', min: 0.05, max: 5, step: 0.05, standard: 1.15 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1.35 },
    { key: 'grain', label: 'Field grain', min: 0, max: 2, step: 0.01, standard: 0.4 },
    { key: 'filmGrain', label: 'Film grain', min: 0, max: 2, step: 0.01, standard: 0.35 },
    { key: 'grainSize', label: 'Grain size', min: 1, max: 8, step: 1, standard: 2 },
    { key: 'rainbow', label: 'Iridescence', min: 0, max: 2, step: 0.01, standard: 0.65 },
    { key: 'flashRate', label: 'Flash rate', min: 0, max: 10, step: 0.05, standard: 1.6 },
    { key: 'flash', label: 'Flash power', min: 0, max: 5, step: 0.03, standard: 0.7 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 0.85 },
    { key: 'rim', label: 'Rim light', min: 0, max: 3, step: 0.015, standard: 0.5 },
  ],
  colours: [
    { key: 'deep', label: 'Deep', standard: '#2a0f4e' },
    { key: 'low', label: 'Low pressure', standard: '#0fd0c3' },
    { key: 'mid', label: 'Mid pressure', standard: '#ff5e9d' },
    { key: 'hot', label: 'High pressure', standard: '#ffd166' },
    { key: 'flash', label: 'Lightning', standard: '#eaf4ff' },
  ],
};

export { STORM };
