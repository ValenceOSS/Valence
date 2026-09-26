import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const CAUSTICS: OrbVariant = {
  key: 'caustics',
  label: 'Caustics',
  shader: `
float causticWarp;
vec2 fold(vec2 p, float t) {
  p += causticWarp        * sin(p.yx * 1.31 + vec2( t * 0.90, -t * 0.70));
  p += causticWarp * 0.60 * sin(p.yx * 2.17 + vec2(-t * 1.30,  t * 1.10));
  p += causticWarp * 0.35 * sin(p.yx * 3.73 + vec2( t * 1.90,  t * 1.60));
  return p;
}
float net(vec2 p, float t) {
  vec2 q = fold(p, t);
  vec2 s = 1.0 - abs(sin(q));
  vec2 l = pow(s, vec2(uP_edge));
  return (l.x + l.y + 2.0 * l.x * l.y) * 0.25;
}
float netOn(vec3 sp, float t) {
  vec3 w = sp * sp;
  w *= w;
  w /= (w.x + w.y + w.z);
  float k = uP_scale;
  return w.x * net(sp.yz * k, t) + w.y * net(sp.zx * k, t) + w.z * net(sp.xy * k, t);
}
void main() {
  vec2 uv = orbUV();
  float rd = length(uv);
  float R = uP_radius;
  float mask = smoothstep(0.012, -0.012, rd - R);
  if (mask <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec2 pl = uv / R;
  float z = sqrt(max(1.0 - dot(pl, pl), 0.0));
  vec3 n = vec3(pl, z);
  float cr = cos(uP_spin);
  float sr = sin(uP_spin);
  vec3 sp = vec3(n.x * cr - n.z * sr, n.y, n.x * sr + n.z * cr);
  float t = uP_flow;
  float surge = 0.5 - 0.5 * cos(uP_swellRate);
  float gainNow = uP_gain * mix(1.0, 0.55 + 0.9 * surge, uP_swell) * (0.8 + 0.5 * uOutput);
  causticWarp = uP_warp * mix(1.0, 0.8 + 0.4 * surge, uP_swell) * (1.0 + 0.35 * uInput);
  float ds = 0.09;
  vec3 c = vec3(netOn(sp, t + ds), netOn(sp, t), netOn(sp, t - ds));
  float cLum = dot(c, vec3(1.0 / 3.0));
  vec3 fringe = (c - cLum) * uP_split;
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  float fres = pow(1.0 - z, 2.5);
  vec3 col = uC_deep * (0.35 + 0.65 * uP_light * lambert);
  col += (uC_sun * cLum + fringe) * gainNow * (0.55 + 0.45 * lambert);
  col += uC_sheen * uP_rim * fres;
  col = pow(max(col, vec3(0.0)), vec3(uP_contrast));
  col = tanh3(col);
  float a = mask;
  gl_FragColor = vec4(max(col, vec3(0.0)) * a, a);
}
`,
  params: [
    {
      key: 'flow',
      label: 'Water flow',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 0.92,
      isRate: true,
    },
    { key: 'spin', label: 'Turn', min: 0, max: 5, step: 0.03, standard: 0.09, isRate: true },
    {
      key: 'swellRate',
      label: 'Surge rate',
      min: 0,
      max: 8,
      step: 0.05,
      standard: 0.6,
      isRate: true,
    },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'scale', label: 'Net scale', min: 3, max: 30, step: 0.1, standard: 9 },
    { key: 'warp', label: 'Ripple depth', min: 0, max: 3, step: 0.02, standard: 0.8 },
    { key: 'edge', label: 'Line sharpness', min: 0.5, max: 10, step: 0.05, standard: 3 },
    { key: 'split', label: 'Colour fringe', min: 0, max: 3, step: 0.02, standard: 0.6 },
    { key: 'swell', label: 'Surge depth', min: 0, max: 1, step: 0.01, standard: 0.15 },
    { key: 'gain', label: 'Sun power', min: 0.05, max: 6, step: 0.05, standard: 6 },
    { key: 'contrast', label: 'Tone knee', min: 0.15, max: 6, step: 0.05, standard: 1.3 },
    { key: 'light', label: 'Floor light', min: 0, max: 3, step: 0.015, standard: 0.9 },
    { key: 'rim', label: 'Rim sheen', min: 0, max: 3, step: 0.015, standard: 0.6 },
  ],
  colours: [
    { key: 'deep', label: 'Water', standard: '#6f0b0b' },
    { key: 'sun', label: 'Caustic light', standard: '#7ff6ff' },
    { key: 'sheen', label: 'Sheen', standard: '#bfe8ff' },
  ],
};

export { CAUSTICS };
