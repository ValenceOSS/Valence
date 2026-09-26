import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const VOXEL_WORLD: OrbVariant = {
  key: 'voxelWorld',
  label: 'Voxel world',
  shader: `
#define STEPS 160
vec3 ckDrift;
float ckVs;
float ckMaxH;
float ckSeaN;
vec4 ckClim;
float ckCherry;
float ckTreeMul;
vec3 ckTreeDir;
float ckTreeH1;
float ckTreeH2;
mat2 ckRot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
float ckN3(vec3 p) {
  float v = (noise(p.xy) + noise(p.yz + 19.1) + noise(p.zx + 47.3)) / 3.0;
  return clamp(0.5 + (v - 0.5) * 1.9, 0.0, 1.0);
}
float ckField(vec3 dir) {
  vec3 q = dir * uP_scale + ckDrift;
  return ckN3(q) * 0.65 + ckN3(q * 2.6 + 31.7) * 0.35;
}
float ckTerrain(vec3 dir) {
  float h = 1.0 + uP_rough * max(ckField(dir) - ckSeaN, 0.0) * 1.2
    * (1.0 + ckClim.w * 0.8);
  float stepH = 3.0 * ckVs;
  float hq = 1.0 + floor((h - 1.0) / stepH) * stepH;
  return mix(h, hq, ckClim.w * 0.85);
}
float ckBiome(vec3 dir) {
  return ckN3(dir * 1.3 + ckDrift + 57.9);
}
void ckTreeCell(vec3 dir) {
  vec3 ad = abs(dir);
  vec2 fuv;
  float face;
  if (ad.x >= ad.y && ad.x >= ad.z) {
    fuv = dir.yz / ad.x;
    face = dir.x > 0.0 ? 0.0 : 1.0;
  } else if (ad.y >= ad.z) {
    fuv = dir.xz / ad.y;
    face = dir.y > 0.0 ? 2.0 : 3.0;
  } else {
    fuv = dir.xy / ad.z;
    face = dir.z > 0.0 ? 4.0 : 5.0;
  }
  float grid = max(uP_blocks / 6.0, 2.0);
  vec2 cell = floor((fuv * 0.5 + 0.5) * grid);
  ckTreeH1 = hash(cell * 1.17 + face * 19.3);
  ckTreeH2 = hash(cell * 0.71 + face * 7.7 + 9.3);
  vec2 jit = vec2(hash(cell + 7.1 + face), hash(cell + 13.7 + face)) - 0.5;
  vec2 auv = ((cell + 0.5 + jit * 0.3) / grid) * 2.0 - 1.0;
  vec3 cp;
  if (face < 1.5) cp = vec3(face < 0.5 ? 1.0 : -1.0, auv.x, auv.y);
  else if (face < 3.5) cp = vec3(auv.x, face < 2.5 ? 1.0 : -1.0, auv.y);
  else cp = vec3(auv.x, auv.y, face < 4.5 ? 1.0 : -1.0);
  ckTreeDir = normalize(cp);
}
float ckVoxel(vec3 cc) {
  float r = length(cc);
  vec3 dir = cc / max(r, 1.0e-4);
  if (r < ckMaxH) {
    float h = ckTerrain(dir);
    if (r < h) {
      if (h > 1.0 + 1.5 * ckVs) {
        float cv = ckN3(cc * (uP_scale * 1.9) + 71.3);
        float cw = uP_cave * 0.16 * smoothstep(ckMaxH, ckMaxH - 0.45, r);
        if (abs(cv - 0.5) < cw) return 0.0;
      }
      return 1.0;
    }
  }
  if (r < ckMaxH + 8.0 * ckVs && uP_trees > 0.001) {
    ckTreeCell(dir);
    float thrMax = clamp(uP_trees, 0.0, 1.0) * 0.8;
    if (ckTreeH1 > 1.0 - thrMax) {
      float bioA = ckBiome(ckTreeDir);
      float dens = bioA > 0.58 ? 1.0 : (bioA > 0.3 ? 0.25 : 0.0);
      dens *= ckTreeMul;
      if (ckTreeH1 > 1.0 - thrMax * dens) {
        float fA = ckField(ckTreeDir);
        float ha = 1.0 + uP_rough * max(fA - ckSeaN, 0.0) * 1.2;
        if (fA > ckSeaN + 0.015 && ha < 1.0 + uP_rough * 0.42) {
          float lat = length(cc - dot(cc, ckTreeDir) * ckTreeDir);
          if (ckClim.z > 0.5) {
            float spikeH = (2.0 + 6.0 * ckTreeH2 * ckTreeH2) * ckVs;
            float w = mix(1.15, 0.3, clamp((r - ha) / spikeH, 0.0, 1.0)) * ckVs;
            if (lat < w && r > ha - ckVs && r < ha + spikeH) return 3.0;
          } else if (ckClim.w > 0.5) {
            float cacH = (1.5 + 2.0 * ckTreeH2) * ckVs;
            if (lat < 0.6 * ckVs && r > ha - ckVs && r < ha + cacH) return 3.0;
          } else if (ckCherry > 0.5) {
            float trunkTop = ha + (2.0 + 1.5 * ckTreeH2) * ckVs;
            if (lat < 0.75 * ckVs && r > ha - ckVs && r < trunkTop) return 2.0;
            vec3 dd = cc - ckTreeDir * (trunkTop + 0.6 * ckVs);
            dd += ckTreeDir * dot(dd, ckTreeDir) * 0.8;
            vec3 lv = floor(cc / ckVs);
            float rag = hash(lv.xy * 0.61 + lv.z * 2.23);
            if (length(dd) < (2.2 + 0.5 * rag) * ckVs) return 3.0;
          } else {
            float trunkTop = ha + (2.5 + 2.0 * ckTreeH2) * ckVs;
            if (lat < 0.75 * ckVs && r > ha - ckVs && r < trunkTop) return 2.0;
            vec3 dd = cc - ckTreeDir * (trunkTop + 0.7 * ckVs);
            vec3 lv = floor(cc / ckVs);
            float rag = hash(lv.xy * 0.61 + lv.z * 2.23);
            if (length(dd) < (1.7 + 0.5 * rag) * ckVs) return 3.0;
          }
        }
      }
    }
  }
  return 0.0;
}
void main() {
  float glowNow = uP_glow * (0.7 + 1.0 * uOutput);
  float gainNow = uP_gain * (0.9 + 0.3 * uOutput);
  float lightNow = uP_light * (1.0 + 0.3 * uInput);
  ckDrift = vec3(uP_drift * 0.31, uP_drift * 0.17, -uP_drift * 0.23);
  float t5 = fract(uP_season * 0.05) * 5.0;
  ckClim = vec4(
    clamp(1.0 - min(abs(t5), abs(t5 - 5.0)), 0.0, 1.0),
    clamp(1.0 - abs(t5 - 4.0), 0.0, 1.0),
    clamp(1.0 - abs(t5 - 2.0), 0.0, 1.0),
    clamp(1.0 - abs(t5 - 3.0), 0.0, 1.0)
  );
  ckCherry = clamp(1.0 - abs(t5 - 1.0), 0.0, 1.0);
  ckTreeMul = dot(ckClim, vec4(1.0, 0.15, 0.9, 0.3)) + ckCherry * 0.9;
  ckVs = 2.0 / clamp(uP_blocks, 8.0, 96.0);
  ckSeaN = 0.25 + clamp(uP_sea, 0.0, 1.0) * 0.5;
  ckMaxH = 1.0 + uP_rough * (1.0 - ckSeaN) * 1.2 * 1.8 + 0.001;
  float bound = ckMaxH + 8.5 * ckVs;
  vec2 uv = orbUV() / uP_radius;
  vec3 ro = vec3(uv * bound, 2.9);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  mat2 tiltM = ckRot(uP_tilt);
  mat2 spinM = ckRot(-uP_spin);
  ro.yz = tiltM * ro.yz;
  ro.xz = spinM * ro.xz;
  rd.yz = tiltM * rd.yz;
  rd.xz = spinM * rd.xz;
  vec3 Lo = normalize(vec3(-0.5, 0.7, 0.55));
  Lo.yz = tiltM * Lo.yz;
  Lo.xz = spinM * Lo.xz;
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
  vec3 p0 = ro + rd * (-b - sq + ckVs * 0.001);
  float tSpan = 2.0 * sq;
  vec3 vp = floor(p0 / ckVs);
  vec3 tDelta = ckVs / abs(rd);
  vec3 tMax = ((vp + step(vec3(0.0), rd)) * ckVs - p0) / rd;
  float mat = 0.0;
  vec3 mask = vec3(0.0, 0.0, 1.0);
  float tCur = 0.0;
  for (int i = 0; i < STEPS; i++) {
    float m = ckVoxel((vp + 0.5) * ckVs);
    if (m > 0.5) {
      mat = m;
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
  if (mat < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 cc = (vp + 0.5) * ckVs;
  float r = length(cc);
  vec3 dir = cc / max(r, 1.0e-4);
  vec3 n = -mask * sgn;
  vec3 hp = p0 + rd * tCur;
  vec2 vseed = vec2(dot(vp, vec3(1.0, 57.0, 113.0)), dot(vp, vec3(27.0, 7.0, 91.0)));
  float h1 = hash(vseed * 0.013);
  float h2 = hash(vseed * 0.029 + 5.7);
  vec2 uvFace;
  if (mask.x > 0.5) uvFace = hp.yz;
  else if (mask.y > 0.5) uvFace = hp.xz;
  else uvFace = hp.xy;
  float grain = hash(floor(fract(uvFace / ckVs) * 4.0) * 0.37 + vseed * 0.11);
  float texMul = mix(1.0, 0.72 + 0.55 * grain, uP_texture);
  float lam = clamp(dot(n, Lo), 0.0, 1.0);
  float wrap = clamp(dot(dir, Lo) * 0.5 + 0.5, 0.0, 1.0);
  float ao = 0.55 + 0.45 * clamp(dot(n, dir) * 0.5 + 0.5, 0.0, 1.0);
  float shade = (0.32 + 0.5 * wrap * wrap + 0.85 * lam * lightNow) * ao;
  vec3 col;
  if (mat < 1.5) {
    float f = ckField(dir);
    float h = 1.0 + uP_rough * max(f - ckSeaN, 0.0) * 1.2;
    float depth = h - r;
    float topF = step(depth, ckVs * 1.15);
    vec3 snow = vec3(0.92, 0.95, 1.0);
    float layer = hash(vec2(floor(r / (ckVs * 2.0)) * 0.371, 5.3));
    vec3 mesaBand = layer < 0.5 ? vec3(0.74, 0.42, 0.21)
      : (layer < 0.68 ? vec3(0.63, 0.26, 0.15)
      : (layer < 0.8 ? vec3(0.88, 0.79, 0.67)
      : (layer < 0.9 ? vec3(0.84, 0.65, 0.27) : vec3(0.4, 0.25, 0.18))));
    vec3 mesaTop = mix(vec3(0.72, 0.38, 0.2), mesaBand, step(1.0 + uP_rough * 0.1, h));
    vec3 climGrass = uC_grass * ckClim.x + uC_sand * ckClim.y
      + snow * ckClim.z + mesaTop * ckClim.w
      + mix(uC_grass, vec3(0.62, 0.85, 0.3), 0.6) * ckCherry;
    vec3 climDirt = uC_dirt * (ckClim.x + ckClim.y + ckCherry)
      + uC_dirt * vec3(0.75, 0.85, 1.05) * ckClim.z + mesaBand * ckClim.w;
    vec3 climSand = uC_sand * (ckClim.x + ckClim.y + ckCherry)
      + mix(uC_sand, snow, 0.9) * ckClim.z + vec3(0.72, 0.35, 0.2) * ckClim.w;
    vec3 climWater = uC_water * (ckClim.x + ckClim.y + ckCherry)
      + vec3(0.62, 0.82, 0.92) * ckClim.z
      + mix(uC_water, vec3(0.42, 0.3, 0.22), 0.4) * ckClim.w;
    if (topF > 0.5 && f < ckSeaN) {
      float deep = clamp((ckSeaN - f) / 0.12, 0.0, 1.0) * (1.0 - 0.55 * ckClim.z);
      vec3 wc = climWater * mix(1.3, 0.55, deep);
      float shim = 0.85 + 0.25 * sin(uAnim * 2.5 + grain * 6.2831 + dir.x * 4.0);
      shim = mix(shim, 1.02, ckClim.z);
      col = wc * (0.45 + 0.55 * wrap) * shim + wc * lam * 0.35;
    } else {
      float dirtF = step(depth, ckVs * 2.4);
      float up = clamp(dot(n, dir), 0.0, 1.0);
      vec3 albedo = mix(uC_stone, climDirt, dirtF);
      albedo = mix(albedo, uC_stone, dirtF * (1.0 - topF) * step(h2, 0.3));
      float bio = ckBiome(dir);
      float desertF = step(bio, 0.3);
      albedo = mix(albedo, climGrass, topF * step(0.45, up) * (1.0 - desertF));
      albedo = mix(albedo, climSand, desertF * dirtF);
      albedo = mix(albedo, climDirt,
        topF * step(1.0 + uP_rough * 0.28, h) * 0.85 * (1.0 - 0.9 * ckClim.z));
      albedo = mix(albedo, uC_stone,
        topF * step(1.0 + uP_rough * 0.45, h) * (1.0 - 0.85 * ckClim.z));
      albedo = mix(albedo, climSand, topF * step(abs(f - ckSeaN - 0.017), 0.018));
      vec3 oc = floor(cc / (2.5 * ckVs));
      vec2 oseed = vec2(dot(oc, vec3(1.0, 57.0, 113.0)), dot(oc, vec3(27.0, 7.0, 91.0)));
      float fleck = step(0.5, hash(floor(fract(uvFace / ckVs) * 4.0) * 0.53 + oseed * 0.19));
      float icePatch = ckClim.z * step(hash(oseed * 0.023 + 9.1), 0.5)
        * step(1.0 + uP_rough * 0.06, h);
      albedo = mix(albedo, vec3(0.55, 0.7, 0.92), icePatch * (0.45 + 0.4 * fleck));
      float veinF = (1.0 - dirtF) * step(1.0 - uP_ore, hash(oseed * 0.017)) * step(h1, 0.8);
      float oreType = hash(oseed * 0.041 + 2.9);
      vec3 oreHue = oreType < 0.4
        ? uC_ore
        : (oreType < 0.75 ? uC_ore * vec3(0.25, 0.45, 1.2) : vec3(0.16));
      float oreLit = oreType < 0.75 ? 1.0 : 0.0;
      albedo = mix(albedo, oreHue, veinF * (0.2 + 0.65 * fleck));
      float twinkle = 0.55 + 0.45 * sin(uP_shuffle + hash(oseed * 0.013) * 37.0);
      float depthDim = mix(1.0, 0.62, clamp(depth / max(uP_rough * 0.9, 0.05), 0.0, 1.0));
      float coreR = 1.0 - uP_rough * 0.6;
      float coreF = uP_core * smoothstep(coreR + 0.15, coreR - 0.05, r);
      vec3 emis = oreHue * veinF * fleck * oreLit * glowNow * twinkle
        + uC_lava * coreF * (0.9 + 0.4 * sin(uP_shuffle * 1.6 + h1 * 51.0))
          * (0.6 + 1.4 * uOutput);
      col = albedo * shade * depthDim + emis;
    }
  } else if (mat < 2.5) {
    col = uC_dirt * 0.5 * shade;
  } else {
    vec3 climLeaf = uC_leaf * (ckClim.x + ckClim.y * 0.9)
      + vec3(0.62, 0.76, 0.95) * ckClim.z
      + mix(uC_leaf, vec3(0.45, 0.62, 0.25), 0.5) * ckClim.w
      + vec3(0.93, 0.7, 0.82) * ckCherry;
    col = climLeaf * shade;
    float leafGrain = mix(0.5 + 0.9 * grain, 0.85 + 0.3 * grain, ckClim.z);
    texMul = mix(1.0, leafGrain, uP_texture);
  }
  col *= texMul * gainNow;
  col = pow(max(col, 0.0), vec3(uP_contrast));
  gl_FragColor = vec4(col, 1.0);
}
`,
  params: [
    { key: 'spin', label: 'Spin', min: 0, max: 5, step: 0.03, standard: 0.22, isRate: true },
    { key: 'tilt', label: 'Tilt', min: 0, max: 4, step: 0.02, standard: 0.45 },
    {
      key: 'drift',
      label: 'Terrain drift',
      min: 0,
      max: 10,
      step: 0.05,
      standard: 0.12,
      isRate: true,
    },
    {
      key: 'season',
      label: 'Season rate',
      min: 0,
      max: 10,
      step: 0.05,
      standard: 0.3,
      isRate: true,
    },
    {
      key: 'shuffle',
      label: 'Ember rate',
      min: 0,
      max: 20,
      step: 0.1,
      standard: 0.8,
      isRate: true,
    },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 1.15 },
    { key: 'blocks', label: 'Blocks', min: 16, max: 96, step: 1, standard: 64 },
    { key: 'rough', label: 'Mountains', min: 0, max: 0.8, step: 0.01, standard: 0.45 },
    { key: 'scale', label: 'Terrain scale', min: 0.5, max: 8, step: 0.05, standard: 2.4 },
    { key: 'sea', label: 'Sea level', min: 0, max: 1, step: 0.01, standard: 0.5 },
    { key: 'trees', label: 'Trees', min: 0, max: 1, step: 0.01, standard: 0.75 },
    { key: 'cave', label: 'Caves', min: 0, max: 1, step: 0.01, standard: 0.4 },
    { key: 'ore', label: 'Ore density', min: 0, max: 0.6, step: 0.01, standard: 0.12 },
    { key: 'glow', label: 'Ore glow', min: 0, max: 5, step: 0.03, standard: 0.9 },
    { key: 'core', label: 'Molten core', min: 0, max: 1, step: 0.01, standard: 0.5 },
    { key: 'texture', label: 'Texture grain', min: 0, max: 1, step: 0.01, standard: 0.6 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 1 },
    { key: 'gain', label: 'Gain', min: 0.05, max: 5, step: 0.05, standard: 1 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1 },
  ],
  colours: [
    { key: 'grass', label: 'Grass', standard: '#6abe30' },
    { key: 'dirt', label: 'Mud', standard: '#6f4a2f' },
    { key: 'stone', label: 'Stone', standard: '#8a8a90' },
    { key: 'sand', label: 'Sand', standard: '#dbcf9c' },
    { key: 'water', label: 'Water', standard: '#2f66d0' },
    { key: 'leaf', label: 'Leaves', standard: '#3e8f27' },
    { key: 'ore', label: 'Ore', standard: '#4de3ff' },
    { key: 'lava', label: 'Lava', standard: '#ff7b26' },
  ],
};

export { VOXEL_WORLD };
