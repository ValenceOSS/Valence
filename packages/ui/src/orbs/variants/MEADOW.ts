import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const MEADOW: OrbVariant = {
  key: 'meadow',
  label: 'Meadow',
  shader: `
#define AA 2
float drosteHaze;
float drosteCloud;
float drosteBloom;
float squareArc(vec2 q) {
  if (abs(q.x) >= abs(q.y)) {
    if (q.x > 0.0) return q.y + 1.0;
    return 5.0 - q.y;
  }
  if (q.y > 0.0) return 3.0 - q.x;
  return 7.0 + q.x;
}
vec3 drosteFlower(float h) {
  vec3 c = uC_cloud;
  c = mix(c, uC_bloom, step(0.52, h));
  c = mix(c, uC_sky, step(0.86, h));
  return c;
}
vec3 drosteRender(vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - uRes) / min(uRes.x, uRes.y);
  float R = max(uP_radius, 0.001);
  vec2 pl = uv / R;
  float z = sqrt(max(1.0 - dot(pl, pl), 0.0));
  float fall = uP_fall;
  float drift = uP_drift;
  float sw = uP_tilt;
  vec2 p = pl / (z + 1.0 + uP_bulge) * uP_scale;
  p = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * p;
  float m = max(max(abs(p.x), abs(p.y)), 0.002);
  float K = max(uP_ratio, 1.05);
  float L = log2(m) / log2(K) + fall;
  vec2 q = p / m;
  float sm = pow(K, fract(L));
  vec2 P = q * sm;
  float Yn = P.y / K;
  float arc = squareArc(q);
  vec3 col = mix(uC_sky * 0.72, uC_sky, clamp(Yn * 1.3, 0.0, 1.0));
  float skyMask = smoothstep(uP_horizon - 0.3, uP_horizon + 0.2, Yn);
  float cl = fbm(P * uP_cloudScale + vec2(drift, drift * 0.3));
  cl = smoothstep(drosteCloud, drosteCloud + 0.16, cl);
  col = mix(col, uC_cloud, cl * (0.2 + 0.8 * skyMask));
  float streak = fbm(vec2(arc * uP_streakFreq, L * uP_streakRad));
  vec3 land = mix(uC_canopy, uC_meadow, smoothstep(0.02, -0.62, Yn));
  land *= 0.42 + 1.25 * streak;
  float water = smoothstep(0.42, 0.16, streak) * smoothstep(0.05, -0.3, Yn);
  land = mix(land, uC_water, water * uP_water);
  vec2 fg = vec2(arc * uP_flowerScale, L * uP_flowerScale * 0.3);
  vec2 fc = floor(fg);
  vec2 ff = fract(fg) - 0.5;
  vec2 dcv = ff - (vec2(hash(fc + 3.7), hash(fc + 19.1)) - 0.5) * 0.6;
  float petal = smoothstep(uP_flowerSize, uP_flowerSize * 0.35, length(dcv));
  float present = step(1.0 - drosteBloom, hash(fc + 51.3));
  float meadow = smoothstep(0.13, -0.38, Yn);
  land = mix(land, drosteFlower(hash(fc + 7.9)), petal * present * meadow);
  float landMask = 1.0 - smoothstep(uP_horizon - 0.12, uP_horizon + 0.16, Yn);
  col = mix(col, land, landMask);
  col *= mix(1.0, uP_frameShade, fract(L));
  float deep = 1.0 - smoothstep(0.0, uP_hazeRange, m);
  col = mix(col, uC_sky, deep * drosteHaze);
  col = pow(max(col, vec3(0.0)), vec3(uP_contrast)) * uP_gain;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uP_saturation);
  vec3 n = vec3(pl, z);
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.72))), 0.0, 1.0);
  col *= 0.72 + uP_light * lambert;
  float fres = 1.0 - z;
  fres = fres * fres * fres;
  col += uC_sheen * uP_rim * fres;
  return col;
}
void main() {
  drosteCloud = clamp(uP_cloudCover - 0.12 * uInput, 0.02, 0.98);
  drosteHaze = uP_haze * (1.0 - 0.25 * uOutput);
  drosteBloom = clamp(uP_flowerDensity * (1.0 + 0.5 * uOutput), 0.0, 1.0);
  vec2 uv = orbUV();
  float mask = smoothstep(0.012, -0.012, length(uv) - max(uP_radius, 0.001));
  if (mask <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 col = vec3(0.0);
#if AA > 1
  for (int mx = 0; mx < AA; mx++) {
    for (int my = 0; my < AA; my++) {
      vec2 off = (vec2(float(mx), float(my)) + 0.5) / float(AA) - 0.5;
      col += drosteRender(gl_FragCoord.xy + off);
    }
  }
  col /= float(AA * AA);
#else
  col = drosteRender(gl_FragCoord.xy);
#endif
  float a = mask;
  gl_FragColor = vec4(max(col, vec3(0.0)) * a, a);
}
`,
  params: [
    { key: 'fall', label: 'Fall speed', min: 0, max: 4, step: 0.01, standard: 0.12, isRate: true },
    { key: 'tilt', label: 'Frame tilt', min: -1.6, max: 1.6, step: 0.01, standard: 0 },
    {
      key: 'drift',
      label: 'Weather drift',
      min: 0,
      max: 4,
      step: 0.02,
      standard: 0.2,
      isRate: true,
    },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'scale', label: 'Tunnel scale', min: 0.3, max: 20, step: 0.1, standard: 4.5 },
    { key: 'bulge', label: 'Dome bulge', min: 0, max: 4, step: 0.02, standard: 0.2 },
    { key: 'ratio', label: 'Frame ratio', min: 1.1, max: 6, step: 0.02, standard: 3.06 },
    { key: 'horizon', label: 'Horizon', min: -0.9, max: 0.9, step: 0.01, standard: -0.11 },
    { key: 'cloudScale', label: 'Cloud scale', min: 0.1, max: 8, step: 0.05, standard: 1.2 },
    { key: 'cloudCover', label: 'Cloud cover', min: 0.02, max: 0.98, step: 0.01, standard: 0.42 },
    { key: 'streakFreq', label: 'Wall detail', min: 0.2, max: 20, step: 0.1, standard: 2.9 },
    { key: 'streakRad', label: 'Smear', min: 0.02, max: 4, step: 0.02, standard: 0.54 },
    { key: 'water', label: 'Water', min: 0, max: 1, step: 0.01, standard: 0 },
    { key: 'flowerScale', label: 'Flower scale', min: 2, max: 120, step: 1, standard: 24 },
    { key: 'flowerDensity', label: 'Flower density', min: 0, max: 1, step: 0.01, standard: 0.27 },
    { key: 'flowerSize', label: 'Flower size', min: 0.05, max: 0.6, step: 0.01, standard: 0.43 },
    { key: 'frameShade', label: 'Frame shading', min: 0.2, max: 1.4, step: 0.01, standard: 0.62 },
    { key: 'haze', label: 'Aerial haze', min: 0, max: 1, step: 0.01, standard: 0.8 },
    { key: 'hazeRange', label: 'Haze reach', min: 0.005, max: 1.5, step: 0.005, standard: 0.09 },
    { key: 'gain', label: 'Brightness', min: 0.05, max: 4, step: 0.02, standard: 1.38 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1.05 },
    { key: 'saturation', label: 'Saturation', min: 0, max: 4, step: 0.02, standard: 1.56 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 0.345 },
    { key: 'rim', label: 'Rim sheen', min: 0, max: 3, step: 0.015, standard: 0.555 },
  ],
  colours: [
    { key: 'sky', label: 'Sky', standard: '#4a92e0' },
    { key: 'cloud', label: 'Cloud', standard: '#f7fbff' },
    { key: 'canopy', label: 'Canopy', standard: '#12401f' },
    { key: 'meadow', label: 'Meadow', standard: '#5aa63a' },
    { key: 'water', label: 'Water', standard: '#156f6a' },
    { key: 'bloom', label: 'Bloom', standard: '#ff6a3a' },
    { key: 'sheen', label: 'Sheen', standard: '#cfe6ff' },
  ],
};

export { MEADOW };
