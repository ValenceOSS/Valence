import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const RADAR: OrbVariant = {
  key: 'radar',
  label: 'Radar',
  shader: `
#define VORTICES 6
#define FBM3_OCT 4
float radarLoNow;
float radarDensityNow;
float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash3(i);
  float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}
float fbm3(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < FBM3_OCT; i++) {
    v += a * noise3(p);
    p = p * 2.03 + vec3(11.7, 7.3, 3.1);
    a *= 0.5;
  }
  return v;
}
vec3 rotateAbout(vec3 v, vec3 k, float a) {
  float c = cos(a);
  float s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}
float intensity(vec3 sp, float t) {
  vec3 q = sp;
  for (int k = 0; k < VORTICES; k++) {
    float fk = float(k);
    vec3 c = normalize(vec3(
      hash(vec2(fk * 3.7, 1.1)) - 0.5,
      hash(vec2(fk * 5.9, 2.3)) - 0.5,
      hash(vec2(fk * 7.1, 4.9)) - 0.5
    ));
    c = rotateAbout(c, vec3(0.0, 1.0, 0.0), sin(t * 0.09 + fk * 1.7) * 0.25);
    float ang = acos(clamp(dot(q, c), -1.0, 1.0));
    float fall = exp(-ang * ang / (uP_vortex * uP_vortex));
    float a = uP_swirl * fall * (mod(fk, 2.0) < 0.5 ? 1.0 : -1.0);
    q = rotateAbout(q, c, a);
  }
  vec3 w = vec3(noise3(q * 1.3 + 2.1), noise3(q * 1.3 + 7.3), noise3(q * 1.3 + 4.4)) - 0.5;
  q += w * uP_warp;
  vec3 pq = q * uP_freq + vec3(t * 0.22, -t * 0.13, t * 0.07);
  float big = clamp((fbm3(pq) - 0.5) * 3.0 + 0.5, 0.0, 1.0);
  float fine = clamp((fbm3(pq * 2.6 + 4.7) - 0.5) * 2.4 + 0.5, 0.0, 1.0);
  float f = big * (0.55 + 0.45 * fine);
  f = clamp((f - radarLoNow) / max(uP_hi - radarLoNow, 0.01), 0.0, 1.0);
  return pow(f, uP_curve);
}
void main() {
  radarLoNow = uP_lo - 0.08 * uInput;
  radarDensityNow = uP_density * (1.0 + 0.5 * uOutput);
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
  float t = uP_speed;
  vec2 st = n.xy / (1.3 + n.z) * uP_scale;
  vec2 g = st * uP_cells;
  vec2 cell = floor(g);
  vec2 fr = fract(g) - 0.5;
  vec2 v = (cell + 0.5) / uP_cells / uP_scale;
  float vv = dot(v, v);
  float A = vv + 1.0;
  float B = 2.6 * vv;
  float C = 1.69 * vv - 1.0;
  float zc = (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
  vec3 nc = vec3(v * (1.3 + zc), zc);
  float cr = cos(uP_spin);
  float sr = sin(uP_spin);
  vec3 spc = vec3(nc.x * cr - nc.z * sr, nc.y, nc.x * sr + nc.z * cr);
  float f = intensity(spc, t);
  float h = hash(cell + 11.7);
  float fd = clamp(f + (h - 0.5) * uP_dither, 0.0, 1.0);
  float cls = 0.0;
  cls += step(0.10, fd);
  cls += step(0.26, fd);
  cls += step(0.38, fd);
  cls += step(0.46, fd);
  cls += step(0.78, fd);
  cls += step(0.94, fd);
  float frame = floor(uTime * uP_twinkle);
  float roll = hash(cell + vec2(frame * 3.7, -frame * 1.3));
  float density = mix(uP_sparse, 1.0, smoothstep(0.0, 0.6, f)) * radarDensityNow;
  float keep = step(roll, density);
  float dsq = max(abs(fr.x), abs(fr.y));
  float dotMask = 1.0 - smoothstep(uP_dot - 0.06, uP_dot + 0.06, dsq);
  vec3 ink = uC_c0;
  ink = cls > 0.5 && cls < 1.5 ? uC_c1 : ink;
  ink = cls > 1.5 && cls < 2.5 ? uC_c2 : ink;
  ink = cls > 2.5 && cls < 3.5 ? uC_c3 : ink;
  ink = cls > 3.5 && cls < 4.5 ? uC_c4 : ink;
  ink = cls > 4.5 && cls < 5.5 ? uC_c5 : ink;
  ink = cls > 5.5 ? uC_c6 : ink;
  vec3 col = mix(uC_paper, ink, dotMask * keep);
  col *= 1.0 + (hash(floor(gl_FragCoord.xy / 2.0) + frame) - 0.5) * uP_grain;
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  col *= 1.0 - uP_light * (1.0 - lambert);
  float fres = pow(1.0 - z, 3.0);
  col = mix(col, uC_c0, fres * uP_rim);
  float a = mask;
  gl_FragColor = vec4(max(col, vec3(0.0)) * a, a);
}
`,
  params: [
    {
      key: 'speed',
      label: 'Front speed',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 1,
      isRate: true,
    },
    { key: 'spin', label: 'Roll', min: 0, max: 5, step: 0.03, standard: 0.27, isRate: true },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'scale', label: 'Grid zoom', min: 0.3, max: 8, step: 0.05, standard: 2.4 },
    { key: 'cells', label: 'Grid', min: 8, max: 120, step: 1, standard: 34 },
    { key: 'dot', label: 'Dot size', min: 0.1, max: 0.5, step: 0.01, standard: 0.36 },
    { key: 'swirl', label: 'Swirl', min: 0, max: 8, step: 0.05, standard: 1.5 },
    { key: 'vortex', label: 'Vortex size', min: 0.1, max: 2, step: 0.01, standard: 0.45 },
    { key: 'freq', label: 'Storm scale', min: 0.2, max: 8, step: 0.05, standard: 1.6 },
    { key: 'warp', label: 'Bend', min: 0, max: 3, step: 0.02, standard: 0.5 },
    { key: 'lo', label: 'Quiet threshold', min: 0, max: 1, step: 0.005, standard: 0.12 },
    { key: 'hi', label: 'Peak threshold', min: 0, max: 1, step: 0.005, standard: 0.82 },
    { key: 'curve', label: 'Response curve', min: 0.5, max: 4, step: 0.05, standard: 1.4 },
    { key: 'dither', label: 'Class dither', min: 0, max: 0.6, step: 0.005, standard: 0.12 },
    { key: 'sparse', label: 'Quiet density', min: 0, max: 1, step: 0.01, standard: 0.16 },
    { key: 'density', label: 'Fill', min: 0, max: 1.5, step: 0.01, standard: 1 },
    { key: 'twinkle', label: 'Twinkle rate', min: 0, max: 30, step: 0.5, standard: 3 },
    { key: 'grain', label: 'Paper grain', min: 0, max: 1, step: 0.01, standard: 0.1 },
    { key: 'light', label: 'Key light', min: 0, max: 1, step: 0.01, standard: 0.18 },
    { key: 'rim', label: 'Rim', min: 0, max: 1, step: 0.01, standard: 0.35 },
  ],
  colours: [
    { key: 'paper', label: 'Paper', standard: '#efe9dc' },
    { key: 'c0', label: 'Quiet', standard: '#a9a9a6' },
    { key: 'c1', label: 'Class 1', standard: '#2e5df0' },
    { key: 'c2', label: 'Class 2', standard: '#38d9ec' },
    { key: 'c3', label: 'Class 3', standard: '#22c35c' },
    { key: 'c4', label: 'Class 4', standard: '#e8322a' },
    { key: 'c5', label: 'Class 5', standard: '#f5d020' },
    { key: 'c6', label: 'Peak', standard: '#e030c0' },
  ],
};

export { RADAR };
