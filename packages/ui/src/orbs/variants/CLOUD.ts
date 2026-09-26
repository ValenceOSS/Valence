import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const CLOUD: OrbVariant = {
  key: 'cloud',
  label: 'Cloud',
  shader: `
#define STEPS 56
#define LIGHT_STEPS 4
#define DENSITY_OCT 4
#define AA 1
const float PI = 3.14159265359;
float nimbusPower;
float nimbusDensity;
float density(vec3 p, float animTime) {
  float shell = 1.0 - length(p) / uP_radius;
  if (shell <= 0.0) return 0.0;
  vec3 q = p * uP_scale;
  float f = 1.0;
  for (int k = 0; k < DENSITY_OCT; k++) {
    q += cos(q.yzx * f + animTime * uP_churn) / f;
    f *= 1.8;
  }
  float n = (sin(q.x) + sin(q.y) + sin(q.z)) / 3.0 * 0.5 + 0.5;
  float clump = smoothstep(uP_threshold, 1.0, n);
  return clump * pow(shell, uP_edgeSoft) * nimbusDensity;
}
float phaseHG(float c, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(max(1.0 + g2 - 2.0 * g * c, 0.0001), 1.5);
}
vec4 nimbusRender(vec2 fragCoord) {
  float animTime = uP_speed;
  vec2 uv = (2.0 * fragCoord - uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, -uP_camDist);
  vec3 rd = normalize(vec3(uv, uP_focal));
  vec3 L = normalize(vec3(
    cos(animTime * uP_lightSpin) * 0.7,
    0.45,
    sin(animTime * uP_lightSpin) * 0.35 + 0.65
  ));
  float phase = phaseHG(dot(rd, L), uP_aniso);
  float toCentre = uP_camDist;
  float tStart = max(toCentre - uP_radius, 0.0);
  float span = 2.0 * uP_radius;
  float dt = span / float(STEPS);
  float T = 1.0;
  vec3 scattered = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    float t = tStart + (float(i) + 0.5) * dt;
    vec3 p = ro + rd * t;
    float dn = density(p, animTime);
    if (dn > 0.001) {
      float shadow = 1.0;
      float lstep = uP_radius / float(LIGHT_STEPS);
      for (int k = 1; k <= LIGHT_STEPS; k++) {
        vec3 lp = p + L * (float(k) - 0.5) * lstep;
        shadow *= exp(-density(lp, animTime) * lstep * uP_shadowAbsorb);
      }
      vec3 lit = mix(uC_shadow * uP_shadowLift, uC_light, shadow);
      scattered += T * dn * dt * lit * phase * nimbusPower;
      T *= exp(-dn * dt * uP_absorb);
      if (T < 0.01) break;
    }
  }
  float body = 1.0 - T;
  scattered += uC_shadow * body * uP_ambient;
  return vec4(scattered, body);
}
void main() {
  nimbusPower = uP_power * (0.7 + 0.9 * uOutput);
  nimbusDensity = uP_density * (1.0 + 0.35 * uInput);
  vec4 acc = vec4(0.0);
#if AA > 1
  for (int mx = 0; mx < AA; mx++) {
    for (int my = 0; my < AA; my++) {
      vec2 offset = vec2(float(mx), float(my)) / float(AA) - 0.5;
      acc += nimbusRender(gl_FragCoord.xy + offset);
    }
  }
  acc /= float(AA * AA);
#else
  acc = nimbusRender(gl_FragCoord.xy);
#endif
  vec3 col = tanh3(acc.rgb * uP_exposure);
  float a = clamp(acc.a * uP_alphaGain, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`,
  params: [
    {
      key: 'speed',
      label: 'Anim speed',
      min: 0.015,
      max: 10,
      step: 0.05,
      standard: 10,
      isRate: true,
    },
    { key: 'camDist', label: 'Camera distance', min: 0.5, max: 40, step: 0.2, standard: 4.4 },
    { key: 'focal', label: 'Lens', min: 0.3, max: 15, step: 0.1, standard: 1.8 },
    { key: 'radius', label: 'Cloud radius', min: 0.15, max: 10, step: 0.05, standard: 2 },
    { key: 'scale', label: 'Cloud scale', min: 0.1, max: 15, step: 0.1, standard: 0.8 },
    { key: 'churn', label: 'Churn', min: 0, max: 5, step: 0.03, standard: 0.3 },
    { key: 'threshold', label: 'Clumping', min: 0, max: 3, step: 0.015, standard: 0.075 },
    { key: 'edgeSoft', label: 'Edge softness', min: 0.1, max: 10, step: 0.05, standard: 0.8 },
    { key: 'density', label: 'Density', min: 0.03, max: 20, step: 0.1, standard: 3.2 },
    { key: 'absorb', label: 'Absorption', min: 0.03, max: 15, step: 0.1, standard: 1.4 },
    { key: 'shadowAbsorb', label: 'Shadow depth', min: 0, max: 20, step: 0.1, standard: 2.4 },
    { key: 'shadowLift', label: 'Shadow lift', min: 0, max: 5, step: 0.03, standard: 0.55 },
    { key: 'aniso', label: 'Forward scatter', min: -0.9, max: 0.9, step: 0.01, standard: 0.45 },
    { key: 'lightSpin', label: 'Light orbit', min: 0, max: 3, step: 0.015, standard: 0.12 },
    { key: 'power', label: 'Light power', min: 0.03, max: 40, step: 0.2, standard: 1.9 },
    { key: 'ambient', label: 'Ambient', min: 0, max: 3, step: 0.015, standard: 0.12 },
    { key: 'exposure', label: 'Exposure', min: 0.03, max: 10, step: 0.05, standard: 1 },
    { key: 'alphaGain', label: 'Alpha gain', min: 0.05, max: 10, step: 0.05, standard: 1.5 },
  ],
  colours: [
    { key: 'light', label: 'Light', standard: '#ffd7a3' },
    { key: 'shadow', label: 'Shadow', standard: '#3a4a8c' },
  ],
};

export { CLOUD };
