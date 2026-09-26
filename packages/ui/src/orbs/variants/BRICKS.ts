import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const BRICKS: OrbVariant = {
  key: 'bricks',
  label: 'Bricks',
  shader: `
#define STEPS 96
vec3 lgCell;
float lgGap;
vec3 lgBid;
float lgOff;
float lgOrient;
mat2 lgRot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
void lgBrick(vec3 cellIdx) {
  lgOrient = mod(cellIdx.y, 2.0);
  float lc = lgOrient < 0.5 ? cellIdx.x : cellIdx.z;
  float sc = lgOrient < 0.5 ? cellIdx.z : cellIdx.x;
  float srow = floor(sc / 2.0);
  lgOff = floor(hash(vec2(cellIdx.y * 3.17, srow * 7.31)) * 4.0);
  lgBid = vec3(floor((lc + lgOff) / 4.0), cellIdx.y, srow + lgOrient * 913.0);
}
float lgSolid(vec3 cc) {
  float r = length(cc);
  if (r >= 1.0) return 0.0;
  if (r > 1.0 - 2.2 * lgCell.y) {
    lgBrick(floor(cc / lgCell));
    float blink = fract(hash(lgBid.xy * 0.173 + lgBid.z * 0.089) + uP_rebuild * 0.03);
    if (blink < lgGap) return 0.0;
  }
  return 1.0;
}
void main() {
  float glossNow = uP_gloss * (0.7 + 0.9 * uOutput);
  float gainNow = uP_gain * (0.92 + 0.25 * uOutput);
  float lightNow = uP_light * (1.0 + 0.3 * uInput);
  float pitch = 2.0 / clamp(uP_studs, 8.0, 48.0);
  lgCell = vec3(pitch, pitch * 1.2, pitch);
  lgGap = clamp(uP_gap, 0.0, 0.9);
  float bound = 1.0 + length(lgCell) * 0.5 + 0.001;
  vec2 uv = orbUV() / uP_radius;
  vec3 ro = vec3(uv * bound, 2.6);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  mat2 tiltM = lgRot(uP_tilt);
  mat2 spinM = lgRot(-uP_spin);
  ro.yz = tiltM * ro.yz;
  ro.xz = spinM * ro.xz;
  rd.yz = tiltM * rd.yz;
  rd.xz = spinM * rd.xz;
  vec3 Lo = normalize(vec3(-0.5, 0.7, 0.55));
  Lo.yz = tiltM * Lo.yz;
  Lo.xz = spinM * Lo.xz;
  vec3 Vo = vec3(0.0, 0.0, 1.0);
  Vo.yz = tiltM * Vo.yz;
  Vo.xz = spinM * Vo.xz;
  vec3 sgn = vec3(
    rd.x >= 0.0 ? 1.0 : -1.0,
    rd.y >= 0.0 ? 1.0 : -1.0,
    rd.z >= 0.0 ? 1.0 : -1.0
  );
  rd = normalize(sgn * max(abs(rd), vec3(1.0e-4)));
  float b = dot(rd, ro);
  float c = dot(ro, ro) - bound * bound;
  float disc = b * b - c;
  if (disc < 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float sq = sqrt(disc);
  vec3 p0 = ro + rd * (-b - sq + pitch * 0.001);
  float tSpan = 2.0 * sq;
  vec3 vp = floor(p0 / lgCell);
  vec3 tDelta = lgCell / abs(rd);
  vec3 tMax = ((vp + step(vec3(0.0), rd)) * lgCell - p0) / rd;
  float hitF = 0.0;
  vec3 mask = vec3(0.0, 0.0, 1.0);
  float tCur = 0.0;
  for (int i = 0; i < STEPS; i++) {
    if (lgSolid((vp + 0.5) * lgCell) > 0.5) {
      hitF = 1.0;
      break;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) {
      tCur = tMax.x;
      tMax.x += tDelta.x;
      vp.x += sgn.x;
      mask = vec3(1.0, 0.0, 0.0);
    } else if (tMax.y < tMax.z) {
      tCur = tMax.y;
      tMax.y += tDelta.y;
      vp.y += sgn.y;
      mask = vec3(0.0, 1.0, 0.0);
    } else {
      tCur = tMax.z;
      tMax.z += tDelta.z;
      vp.z += sgn.z;
      mask = vec3(0.0, 0.0, 1.0);
    }
    if (tCur > tSpan) break;
  }
  if (hitF < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 cc = (vp + 0.5) * lgCell;
  float r = length(cc);
  vec3 dir = cc / max(r, 1.0e-4);
  lgBrick(vp);
  vec3 n = -mask * sgn;
  vec3 hp = p0 + rd * tCur;
  float cph = hash(lgBid.xy * 1.37 + lgBid.z * 0.91);
  float rn = noise(dir.xy * 2.6 + 7.0) * 0.5 + noise(dir.yz * 2.6 + 13.0) * 0.5;
  rn = clamp(0.5 + (rn - 0.5) * 2.2, 0.0, 0.999);
  float idx = floor(clamp(mix(cph, rn, clamp(uP_patch, 0.0, 1.0)), 0.0, 0.999) * 5.0);
  vec3 albedo = idx < 0.5 ? uC_brickA
    : (idx < 1.5 ? uC_brickB
    : (idx < 2.5 ? uC_brickC
    : (idx < 3.5 ? uC_brickD : uC_brickE)));
  albedo *= 0.93 + 0.14 * hash(lgBid.xy * 0.53 + lgBid.z * 1.7);
  vec3 sp = hp / lgCell;
  float lcC = lgOrient < 0.5 ? sp.x : sp.z;
  float scC = lgOrient < 0.5 ? sp.z : sp.x;
  float u4 = fract((lcC + lgOff) / 4.0);
  float v2 = fract(scC / 2.0);
  float wY = fract(sp.y);
  float dL = min(u4, 1.0 - u4) * 4.0 * pitch;
  float dS = min(v2, 1.0 - v2) * 2.0 * pitch;
  float dY = min(wY, 1.0 - wY) * lgCell.y;
  float seamD;
  if (mask.y > 0.5) seamD = min(dL, dS);
  else if (mask.x > 0.5) seamD = min(dY, lgOrient < 0.5 ? dS : dL);
  else seamD = min(dY, lgOrient < 0.5 ? dL : dS);
  float seam = (1.0 - smoothstep(0.0, 0.07 * pitch, seamD)) * clamp(uP_seam, 0.0, 1.0);
  vec3 nEff = n;
  float studF = 0.0;
  float shadowF = 0.0;
  float engrave = 0.0;
  float studAmt = clamp(uP_stud, 0.0, 1.0);
  if (mask.y > 0.5 && n.y > 0.5) {
    vec2 cuv = fract(hp.xz / pitch) - 0.5;
    float sd = length(cuv);
    float rim = smoothstep(0.14, 0.29, sd) * (1.0 - smoothstep(0.29, 0.335, sd));
    vec3 tiltN = normalize(vec3(cuv.x, 0.42, cuv.y));
    nEff = normalize(mix(n, tiltN, rim * studAmt));
    studF = 1.0 - smoothstep(0.285, 0.33, sd);
    vec2 lxz = normalize(Lo.xz + vec2(1.0e-5));
    float away = clamp(dot(normalize(cuv + vec2(1.0e-5)), -lxz), 0.0, 1.0);
    shadowF = smoothstep(0.47, 0.335, sd) * (1.0 - studF) * (0.35 + 0.65 * away);
    engrave = smoothstep(0.11, 0.135, sd) * (1.0 - smoothstep(0.155, 0.18, sd)) * studF;
  }
  float lam = clamp(dot(nEff, Lo), 0.0, 1.0);
  float wrap = clamp(dot(dir, Lo) * 0.5 + 0.5, 0.0, 1.0);
  float depthDim = mix(1.0, 0.55, clamp((1.0 - r) / (3.0 * lgCell.y), 0.0, 1.0));
  float shade = (0.34 + 0.42 * wrap * wrap + 0.8 * lam * lightNow) * depthDim;
  vec3 col = albedo * shade * (1.0 + 0.1 * studF);
  col *= 1.0 - shadowF * 0.38 * studAmt;
  col *= 1.0 - engrave * 0.14 * studAmt;
  float bevel = smoothstep(0.05 * pitch, 0.085 * pitch, seamD)
    * (1.0 - smoothstep(0.085 * pitch, 0.16 * pitch, seamD));
  col += albedo * bevel * (0.18 + 0.5 * lam) * clamp(uP_seam, 0.0, 1.0);
  col *= 1.0 - seam * 0.8;
  float ndh = clamp(dot(nEff, normalize(Lo + Vo)), 0.0, 1.0);
  float spec = pow(ndh, 48.0) + 0.22 * pow(ndh, 8.0);
  col += vec3(1.0) * spec * glossNow * (1.0 - seam) * depthDim;
  col *= gainNow;
  col = pow(max(col, 0.0), vec3(uP_contrast));
  gl_FragColor = vec4(col, 1.0);
}
`,
  params: [
    { key: 'spin', label: 'Spin', min: 0, max: 5, step: 0.03, standard: 0.25, isRate: true },
    { key: 'tilt', label: 'Tilt', min: 0, max: 4, step: 0.02, standard: 0.55 },
    {
      key: 'rebuild',
      label: 'Rebuild rate',
      min: 0,
      max: 20,
      step: 0.1,
      standard: 0.4,
      isRate: true,
    },
    { key: 'gap', label: 'Missing bricks', min: 0, max: 0.8, step: 0.01, standard: 0.07 },
    { key: 'studs', label: 'Studs', min: 8, max: 48, step: 1, standard: 18 },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.95 },
    { key: 'patch', label: 'Colour patches', min: 0, max: 1, step: 0.01, standard: 0.35 },
    { key: 'stud', label: 'Stud relief', min: 0, max: 1, step: 0.01, standard: 0.85 },
    { key: 'seam', label: 'Seams', min: 0, max: 1, step: 0.01, standard: 0.6 },
    { key: 'gloss', label: 'Gloss', min: 0, max: 3, step: 0.02, standard: 1 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 1 },
    { key: 'gain', label: 'Gain', min: 0.05, max: 5, step: 0.05, standard: 1 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1 },
  ],
  colours: [
    { key: 'brickA', label: 'Red', standard: '#c4281c' },
    { key: 'brickB', label: 'Yellow', standard: '#f2cd37' },
    { key: 'brickC', label: 'Blue', standard: '#1e5aa8' },
    { key: 'brickD', label: 'Green', standard: '#00852b' },
    { key: 'brickE', label: 'White', standard: '#f4f4f4' },
  ],
};

export { BRICKS };
