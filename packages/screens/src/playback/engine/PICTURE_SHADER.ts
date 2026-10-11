const PICTURE_SHADER = String.raw`
@group(0) @binding(0) var pictureSampler: sampler;
@group(0) @binding(1) var picture: texture_external;

struct Corner {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

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
  return textureSampleBaseClampToEdge(picture, pictureSampler, corner.uv);
}
`;

export { PICTURE_SHADER };
