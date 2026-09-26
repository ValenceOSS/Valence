import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const LED_WALL: OrbVariant = {
  key: 'ledWall',
  label: 'LED wall',
  shader: `
void main() {
  float coverNow = uP_coverage + 0.07 * uInput;
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
  float churnT = uP_churn;
  float shuffleT = uP_shuffle;
  vec2 f1 = vec2(driftT * 0.5, -driftT * 0.35);
  vec2 f2 = vec2(-churnT * 0.4, churnT * 0.6);
  vec2 warp = vec2(
    fbm(p2 * 0.9 + f2),
    fbm(p2 * 0.9 + f2.yx + 13.7)
  ) - 0.5;
  float field = fbm(p2 + f1 + warp * uP_swirl * 2.4);
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  float lum = smoothstep(1.0 - coverNow, 1.14 - coverNow, field
    + 0.25 * uP_light * lambert
    + uP_pulse * 0.3 * sin(length(uv) * 5.0 - driftT * 3.2));
  lum *= gainNow;
  vec2 d2 = abs(g - 0.5);
  float d = max(d2.x, d2.y);
  float face = 1.0 - smoothstep(0.26, 0.36, d);
  float tile = 1.0 - smoothstep(0.42, 0.48, d);
  float hot = 1.0 - smoothstep(0.0, 0.34, length(d2));
  float h1 = hash(cellIdx * 1.618 + 7.3);
  float h2 = hash(cellIdx * 2.113 + 41.7);
  float cyc = fract(h1 + shuffleT * 0.06);
  float promoted = step(1.0 - uP_confetti, cyc);
  vec3 confetti = 0.5 + 0.5 * cos(6.2831 * (h2 + vec3(0.0, 0.33, 0.67)));
  confetti = normalize(confetti + 0.05) * 1.2;
  vec3 litCol = mix(uC_lit, confetti, promoted);
  vec3 offCol = uC_wall * tile;
  vec3 onCol = litCol * (face * 1.05 + hot * 0.5) * lum;
  vec3 col = offCol + onCol;
  col = pow(max(col, 0.0), vec3(uP_contrast));
  float a = mask;
  gl_FragColor = vec4(col * a, a);
}
`,
  params: [
    { key: 'drift', label: 'Drift', min: 0, max: 10, step: 0.05, standard: 0.45, isRate: true },
    { key: 'churn', label: 'Churn', min: 0, max: 10, step: 0.05, standard: 0.5, isRate: true },
    { key: 'swirl', label: 'Fluidity', min: 0, max: 3, step: 0.015, standard: 1.2 },
    { key: 'shuffle', label: 'Shuffle', min: 0, max: 20, step: 0.1, standard: 0.6, isRate: true },
    { key: 'pulse', label: 'Pulse depth', min: 0, max: 2, step: 0.01, standard: 0 },
    { key: 'spin', label: 'Roll', min: 0, max: 5, step: 0.03, standard: 0.1, isRate: true },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'cells', label: 'Tile grid', min: 16, max: 160, step: 2, standard: 48 },
    { key: 'scale', label: 'Blob scale', min: 0.3, max: 10, step: 0.1, standard: 1.3 },
    { key: 'coverage', label: 'Coverage', min: 0, max: 1.2, step: 0.01, standard: 0.52 },
    { key: 'confetti', label: 'Confetti', min: 0, max: 1, step: 0.01, standard: 0.22 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 0.6 },
    { key: 'gain', label: 'Panel gain', min: 0.05, max: 5, step: 0.05, standard: 1 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1 },
  ],
  colours: [
    { key: 'lit', label: 'Lit tile', standard: '#fff2dd' },
    { key: 'wall', label: 'Wall', standard: '#161616' },
  ],
};

export { LED_WALL };
