import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const ORBITAL: OrbVariant = {
  key: 'orbital',
  label: 'Orbital',
  shader: `
const float PI = 3.14159265359;
void main() {
  vec2 uv = orbUV();
  float r2d = length(uv);
  float R = uP_radius + uP_swell * uInput;
  float mask = smoothstep(0.012, -0.012, r2d - R);
  float nr = clamp(r2d / max(R, 0.001), 0.0, 1.0);
  float z = sqrt(max(1.0 - nr * nr, 0.0));
  float posScale = uP_posScale * (0.8 + 0.45 * uOutput + 0.2 * uInput);
  float radialPow = uP_radialPow * (0.7 + 0.8 * uOutput);
  float radialDecay = uP_radialDecay * (1.25 - 0.5 * uOutput);
  float probPow = uP_probPow * (1.3 - 0.55 * uOutput);
  float probGain = uP_probGain * (0.7 + 0.6 * uOutput + 0.5 * uInput);
  float waveFreq = uP_waveFreq * (0.6 + 1.0 * uOutput);
  float chromaSpread = uP_chromaSpread * (0.6 + 0.9 * uOutput + 0.5 * uInput);
  float animTime = uP_speed;
  float cosT = cos(animTime * uP_rotSpeed);
  float sinT = sin(animTime * uP_rotSpeed);
  vec3 sp = vec3(uv / max(R, 0.001), z) * posScale;
  vec3 pos = vec3(sp.x * cosT - sp.z * sinT, sp.y, sp.x * sinT + sp.z * cosT);
  float tilt = sin(animTime * 0.21 + 1.7) * uP_precess;
  float cx = cos(tilt), sx = sin(tilt);
  pos = vec3(pos.x, pos.y * cx - pos.z * sx, pos.y * sx + pos.z * cx);
  float flowT = uP_flowSpeed;
  float fAmp = uP_flowAmp * (0.7 + 0.6 * uOutput + 0.4 * uInput);
  vec3 w;
  w.x = fbm(pos.yz * uP_flowScale + vec2(flowT * 0.70, -flowT * 0.40));
  w.y = fbm(pos.zx * uP_flowScale + vec2(-flowT * 0.55, flowT * 0.62) + 3.7);
  w.z = fbm(pos.xy * uP_flowScale + vec2(flowT * 0.50, flowT * 0.85) + 7.1);
  pos += (w - 0.5) * fAmp;
  float r = length(pos) + 0.001;
  float theta = acos(clamp(pos.y / r, -1.0, 1.0));
  float phi = atan(pos.z, pos.x);
  float a0 = 0.5;
  float rho = 2.0 * r / (5.0 * a0);
  float radial = pow(rho, radialPow) * exp(-rho / radialDecay);
  float angular = pow(sin(theta), 3.0) * cos(phi + animTime * 0.2);
  float psi = radial * angular;
  float probability = psi * psi;
  float waveN = max(1.0, floor(waveFreq + 0.5));
  float wavePhase = phi * waveN + theta * 2.5 - animTime * 2.0;
  probability *= (0.85 + 0.15 * sin(wavePhase));
  float patches = fbm(pos.xy * 1.6 + vec2(flowT * 0.4, -flowT * 0.3));
  probability *= 0.65 + 0.7 * patches;
  probability = pow(probability, probPow) * probGain;
  probability = clamp(probability, 0.0, 1.0);
  float fresnel = pow(1.0 - z, 1.5);
  float chromaOffset = phi * 2.0 + theta * 1.5 + animTime * 0.3 + probability * 3.0;
  vec3 rainbow;
  rainbow.r = sin(chromaOffset) * 0.5 + 0.5;
  rainbow.g = sin(chromaOffset + chromaSpread) * 0.5 + 0.5;
  rainbow.b = sin(chromaOffset + chromaSpread * 2.0) * 0.5 + 0.5;
  rainbow = normalize(rainbow + 0.01) * length(rainbow);
  float bandFreq = chromaOffset * 3.0 + fresnel * 2.4;
  vec3 chromaticBands;
  chromaticBands.r = sin(bandFreq) * 0.5 + 0.5;
  chromaticBands.g = sin(bandFreq + 2.094) * 0.5 + 0.5;
  chromaticBands.b = sin(bandFreq + 4.189) * 0.5 + 0.5;
  vec3 glowColor = mix(rainbow, chromaticBands, 0.12);
  glowColor = pow(glowColor, vec3(0.8));
  vec3 darkMetal = vec3(uP_metalDark);
  vec3 lightMetal = mix(vec3(0.9, 0.92, 0.95), glowColor, 0.7);
  float metalGradient = smoothstep(0.0, 1.0, probability * 0.7 + fresnel * 0.3);
  vec3 metalColor = mix(darkMetal, lightMetal, metalGradient);
  float orbGlow = uP_glow + 0.6 * uOutput;
  float totalGlow = (0.25 + fresnel * 0.6 + probability * 0.8) * orbGlow;
  float glowAmount = clamp(pow(totalGlow, 0.7), 0.0, 1.0);
  vec3 surfaceColor = mix(metalColor, glowColor, glowAmount);
  vec3 normal = vec3(uv / max(R, 0.001), z);
  float specular = pow(max(dot(normal, normalize(vec3(1.0, 1.0, 2.0))), 0.0), 32.0);
  surfaceColor += mix(vec3(1.0), glowColor, 0.6) * specular * 0.4;
  float visibility = clamp(probability * 1.2 + fresnel * 0.3 + uP_baseVis + uInput * 0.15, 0.0, 1.0);
  float a = mask * visibility;
  gl_FragColor = vec4(surfaceColor * a, a);
}
`,
  params: [
    {
      key: 'speed',
      label: 'Anim speed',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 0.9,
      isRate: true,
    },
    { key: 'rotSpeed', label: 'Rotation speed', min: 0, max: 5, step: 0.05, standard: 0.5 },
    { key: 'radius', label: 'Radius', min: 0.15, max: 3, step: 0.015, standard: 0.9 },
    { key: 'swell', label: 'Input swell', min: 0, max: 1, step: 0.01, standard: 0.07 },
    { key: 'posScale', label: 'Orbital zoom', min: 0.15, max: 10, step: 0.05, standard: 0.5 },
    {
      key: 'flowSpeed',
      label: 'Flow speed',
      min: 0,
      max: 10,
      step: 0.05,
      standard: 0.35,
      isRate: true,
    },
    { key: 'flowAmp', label: 'Flow amount', min: 0, max: 4, step: 0.05, standard: 0.45 },
    { key: 'flowScale', label: 'Flow scale', min: 0.3, max: 10, step: 0.1, standard: 0.3 },
    { key: 'precess', label: 'Precession', min: 0, max: 4, step: 0.05, standard: 0.3 },
    { key: 'radialPow', label: 'Radial power', min: 0.5, max: 15, step: 0.1, standard: 0.5 },
    { key: 'radialDecay', label: 'Radial decay', min: 0.3, max: 30, step: 0.15, standard: 1 },
    { key: 'probPow', label: 'Probability curve', min: 0.1, max: 3, step: 0.015, standard: 0.4 },
    { key: 'probGain', label: 'Probability gain', min: 0.15, max: 15, step: 0.1, standard: 3 },
    { key: 'waveFreq', label: 'Wave frequency', min: 0, max: 20, step: 0.5, standard: 4 },
    { key: 'chromaSpread', label: 'Chroma spread', min: 0, max: 1.5, step: 0.01, standard: 0.18 },
    { key: 'glow', label: 'Glow', min: 0, max: 5, step: 0.05, standard: 0.9 },
    { key: 'metalDark', label: 'Metal darkness', min: 0, max: 3, step: 0.015, standard: 0 },
    { key: 'baseVis', label: 'Base visibility', min: 0, max: 1.5, step: 0.01, standard: 0.12 },
  ],
  colours: [],
};

export { ORBITAL };
