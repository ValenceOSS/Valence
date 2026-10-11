const PICTURE_SHADER = String.raw`
struct Grade {
  signal: u32,
  isWideGamut: u32,
  sourcePeak: f32,
  whiteNits: f32,
};

@group(0) @binding(0) var pictureSampler: sampler;
@group(0) @binding(1) var picture: texture_external;
@group(0) @binding(2) var<uniform> grade: Grade;

struct Corner {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

const M1 = 0.1593017578125;
const M2 = 78.84375;
const C1 = 0.8359375;
const C2 = 18.8515625;
const C3 = 18.6875;
const LUMA = vec3f(0.2627, 0.6780, 0.0593);
const TO_BT709 = mat3x3f(
  vec3f(1.6605, -0.1246, -0.0182),
  vec3f(-0.5876, 1.1329, -0.1006),
  vec3f(-0.0728, -0.0083, 1.1187),
);

fn pqToNits(encoded: f32) -> f32 {
  let p = pow(max(encoded, 0.0), 1.0 / M2);
  return 10000.0 * pow(max(p - C1, 0.0) / (C2 - C3 * p), 1.0 / M1);
}

fn nitsToPq(nits: f32) -> f32 {
  let p = pow(max(nits, 0.0) / 10000.0, M1);
  return pow((C1 + C2 * p) / (1.0 + C3 * p), M2);
}

fn hlgToNits(encoded: vec3f) -> vec3f {
  let a = 0.17883277;
  let b = 0.28466892;
  let c = 0.55991073;
  let low = encoded * encoded / 3.0;
  let high = (exp((encoded - c) / a) + b) / 12.0;
  let scene = select(high, low, encoded <= vec3f(0.5));
  let brightness = max(dot(scene, LUMA), 1e-6);
  return 1000.0 * pow(brightness, 0.2) * scene;
}

fn rollOff(nits: f32) -> f32 {
  let sourcePq = nitsToPq(grade.sourcePeak);
  let reach = nitsToPq(grade.whiteNits) / sourcePq;
  let knee = 1.5 * reach - 0.5;
  let level = nitsToPq(nits) / sourcePq;

  if (level <= knee) {
    return nits;
  }

  let t = (level - knee) / (1.0 - knee);
  let t2 = t * t;
  let t3 = t2 * t;
  let curved = (2.0 * t3 - 3.0 * t2 + 1.0) * knee + (t3 - 2.0 * t2 + t) * (1.0 - knee) + (-2.0 * t3 + 3.0 * t2) * reach;
  return pqToNits(curved * sourcePq);
}

fn toSrgb(linear: vec3f) -> vec3f {
  let clipped = clamp(linear, vec3f(0.0), vec3f(1.0));
  let low = clipped * 12.92;
  let high = 1.055 * pow(clipped, vec3f(1.0 / 2.4)) - 0.055;
  return select(high, low, clipped <= vec3f(0.0031308));
}

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> Corner {
  let xy = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  var corner: Corner;
  corner.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
  corner.uv = vec2f(xy.x, 1.0 - xy.y);
  return corner;
}

@fragment
fn fragmentMain(corner: Corner) -> @location(0) vec4f {
  let sample = textureSampleBaseClampToEdge(picture, pictureSampler, corner.uv);

  if (grade.signal == 0u) {
    return sample;
  }

  var nits: vec3f;

  if (grade.signal == 1u) {
    nits = vec3f(pqToNits(sample.r), pqToNits(sample.g), pqToNits(sample.b));
  } else {
    nits = hlgToNits(sample.rgb);
  }

  let brightest = max(max(nits.r, nits.g), max(nits.b, 1e-6));
  let mapped = nits * (rollOff(brightest) / brightest) / grade.whiteNits;
  let shown = select(mapped, TO_BT709 * mapped, grade.isWideGamut == 1u);

  return vec4f(toSrgb(shown), 1.0);
}
`;

export { PICTURE_SHADER };
