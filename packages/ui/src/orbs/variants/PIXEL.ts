import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const PIXEL: OrbVariant = {
  key: 'pixel',
  label: 'Pixel',
  shader: `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer8(vec2 a) {
  return bayer2(a * 0.25) * 0.0625 + bayer2(a * 0.5) * 0.25 + bayer2(a);
}
void main() {
  float plasmaAmt = uP_plasma * (1.0 + 0.4 * uInput);
  float gainNow = uP_gain * (0.85 + 0.5 * uOutput);
  float cellPx = max(min(uRes.x, uRes.y) / max(uP_cells, 8.0), 1.0);
  vec2 pix = floor(gl_FragCoord.xy / cellPx);
  vec2 cellCentre = (pix + 0.5) * cellPx;
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
  float t = uP_speed;
  float f = uP_scale;
  float v = sin(sp.x * f * 3.1 + t)
    + sin((sp.y * 0.85 + sp.z * 0.4) * f * 3.6 - t * 1.3)
    + sin((sp.x + sp.y + sp.z) * f * 2.2 + t * 0.7);
  vec2 src = 0.55 * vec2(cos(t * 0.5), sin(t * 0.5));
  v += sin(length(uv - src) * f * 5.0 - t * 2.2);
  v *= 0.25;
  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  float fres = pow(1.0 - z, 2.0);
  float lum = (0.5 + 0.5 * v * plasmaAmt) * (0.3 + uP_light * lambert)
    + uP_rim * fres;
  lum = pow(clamp(lum * gainNow, 0.0, 1.0), uP_contrast);
  float steps = max(uP_levels - 1.0, 1.0);
  float q = clamp(floor(lum * steps + bayer8(pix)) / steps, 0.0, 1.0);
  vec3 col = mix(uC_ink, uC_paper, q);
  float a = mask;
  gl_FragColor = vec4(col * a, a);
}
`,
  params: [
    {
      key: 'speed',
      label: 'Wave speed',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 0.5,
      isRate: true,
    },
    { key: 'spin', label: 'Roll', min: 0, max: 5, step: 0.03, standard: 0.15, isRate: true },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'cells', label: 'Grid cells', min: 32, max: 320, step: 2, standard: 140 },
    { key: 'levels', label: 'Tone steps', min: 2, max: 8, step: 1, standard: 3 },
    { key: 'scale', label: 'Wave scale', min: 0.3, max: 12, step: 0.1, standard: 1.5 },
    { key: 'plasma', label: 'Wave amount', min: 0, max: 3, step: 0.015, standard: 0.9 },
    { key: 'light', label: 'Key light', min: 0, max: 3, step: 0.015, standard: 0.9 },
    { key: 'rim', label: 'Rim light', min: 0, max: 3, step: 0.015, standard: 0.35 },
    { key: 'gain', label: 'Brightness', min: 0.05, max: 5, step: 0.05, standard: 1 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 10, step: 0.05, standard: 1.1 },
  ],
  colours: [
    { key: 'ink', label: 'Ink', standard: '#101426' },
    { key: 'paper', label: 'Paper', standard: '#cfe6ff' },
  ],
};

export { PIXEL };
