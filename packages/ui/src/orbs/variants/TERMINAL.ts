import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const TERMINAL: OrbVariant = {
  key: 'terminal',
  label: 'Terminal',
  shader: `
void main() {
  float densBias = uP_density + 0.2 * uInput;
  float gainNow = uP_gain * (0.85 + 0.5 * uOutput);
  float cellPx = max(min(uRes.x, uRes.y) / max(uP_cells, 8.0), 4.0);
  vec2 cellIdx = floor(gl_FragCoord.xy / cellPx);
  vec2 cellCentre = (cellIdx + 0.5) * cellPx;
  vec2 g = fract(gl_FragCoord.xy / cellPx);
  vec2 suv = (2.0 * cellCentre - uRes) / min(uRes.x, uRes.y);
  vec2 uv = suv / uP_radius;
  float r2 = dot(uv, uv);
  float mask = 1.0 - step(1.0, r2);
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vec3(uv, z);
  float rot = uP_spin;
  float cr = cos(rot);
  float sr = sin(rot);
  vec3 sp = vec3(n.x * cr - n.z * sr, n.y, n.x * sr + n.z * cr);
  vec2 p2 = sp.xy / (abs(sp.z) + 1.2) * uP_scale * 3.0;
  float driftT = uP_drift;
  float scrollT = uP_scroll;
  float t = uP_speed;
  vec2 flow = vec2(driftT * 0.6, -driftT * 0.45 - scrollT);
  float field = fbm(p2 + flow);
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  float dens = clamp((field - 0.5) * 1.8 + densBias + 0.4 * uP_light * lambert
    + uP_pulse * 0.35 * sin(length(uv) * 5.5 - t * 2.4), 0.0, 1.0);
  float rowI = floor(g.y * 4.0);
  float bar = step(0.22, fract(g.y * 4.0)) * step(fract(g.y * 4.0), 0.9);
  float stripe = step(0.18, fract(g.x * 3.0));
  float lit = step(rowI + 0.5, dens * 4.0 * gainNow);
  float glyph = bar * stripe * lit;
  vec2 superCentre = (floor(cellIdx / 2.0) * 2.0 + 1.0) * cellPx;
  vec2 sSuv = (2.0 * superCentre - uRes) / min(uRes.x, uRes.y);
  vec2 sUv2 = sSuv / uP_radius;
  float sz = sqrt(max(1.0 - dot(sUv2, sUv2), 0.0));
  vec3 ssp = vec3(sUv2.x * cr - sz * sr, sUv2.y, sUv2.x * sr + sz * cr);
  float superField = fbm(ssp.xy / (abs(ssp.z) + 1.2) * uP_scale * 3.0 + flow);
  float keep = step(uP_dropout, superField + 0.15 * uOutput);
  glyph *= keep;
  vec3 glyphCol = mix(uC_deep, uC_glow, dens);
  glyphCol += vec3(0.7, 1.0, 0.9) * pow(dens, 3.0) * 0.35;
  float fres = pow(1.0 - z, 2.2);
  vec3 col = uC_deep * 0.22 + glyphCol * glyph + uC_glow * fres * uP_rim;
  col = pow(max(col, 0.0), vec3(uP_contrast));
  float a = mask;
  gl_FragColor = vec4(col * a, a);
}
`,
  params: [
    { key: 'drift', label: 'Drift', min: 0, max: 10, step: 0.05, standard: 0.55, isRate: true },
    { key: 'scroll', label: 'Scroll', min: 0, max: 10, step: 0.05, standard: 0.05, isRate: true },
    {
      key: 'speed',
      label: 'Pulse rate',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 0.52,
      isRate: true,
    },
    { key: 'pulse', label: 'Pulse depth', min: 0, max: 2, step: 0.01, standard: 0 },
    { key: 'spin', label: 'Roll', min: 0, max: 5, step: 0.03, standard: 0.12, isRate: true },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'cells', label: 'Glyph grid', min: 16, max: 120, step: 2, standard: 68 },
    { key: 'scale', label: 'Field scale', min: 0.3, max: 10, step: 0.1, standard: 5.1 },
    { key: 'density', label: 'Glyph density', min: 0, max: 2, step: 0.01, standard: 0.31 },
    { key: 'dropout', label: 'Dropout', min: 0, max: 1, step: 0.01, standard: 0.24 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 1.11 },
    { key: 'rim', label: 'Rim glow', min: 0, max: 3, step: 0.015, standard: 0.66 },
    { key: 'gain', label: 'Phosphor gain', min: 0.05, max: 5, step: 0.05, standard: 0.9 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1 },
  ],
  colours: [
    { key: 'glow', label: 'Glow', standard: '#6a57ff' },
    { key: 'deep', label: 'Deep', standard: '#0b3b2d' },
  ],
};

export { TERMINAL };
