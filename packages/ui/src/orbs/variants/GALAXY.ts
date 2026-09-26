import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const GALAXY: OrbVariant = {
  key: 'galaxy',
  label: 'Galaxy',
  shader: `
#define STEPS 56
#define TURB_OCT 4
float galDensity;
float galCore;
float galFalloff;
float galaxy(vec3 p, float t, out float arm, out float rho) {
  rho = length(p.xz);
  float h = p.y;
  float phi = rho > 1e-4 ? atan(p.z, p.x) : 0.0;
  float lr = log(max(rho, 0.02));
  float armPhase = phi * uP_arms - uP_wind * lr;
  vec3 q = p * uP_turbScale;
  float f = 1.0;
  for (int k = 0; k < TURB_OCT; k++) {
    q += cos(q.yzx * f + t) / f;
    f *= 1.9;
  }
  float n = (sin(q.x) + sin(q.y) + sin(q.z)) / 3.0 * 0.5 + 0.5;
  float clump = smoothstep(uP_threshold, 1.0, n);
  arm = 0.5 + 0.5 * cos(armPhase + (n - 0.5) * uP_ragged);
  arm = pow(arm, uP_armSharp);
  float scaleH = uP_thick * (0.12 + rho);
  float disc = exp(-rho * galFalloff) * exp(-abs(h) / scaleH);
  float bulge = exp(-dot(p, p) * uP_bulge);
  float dens = disc * (0.08 + 1.6 * arm) * (0.25 + 0.75 * clump) + bulge * galCore;
  return dens * galDensity;
}
float starField(vec2 p, float density, float size, float twinkleT) {
  vec2 id = floor(p);
  vec2 f = fract(p);
  float acc = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 cid = id + o;
      float h = hash(cid);
      if (h > density) continue;
      vec2 sp = o + vec2(hash(cid + 1.3), hash(cid + 2.7));
      float dd = length(f - sp);
      float tw = 0.55 + 0.45 * sin(twinkleT * (1.5 + 5.0 * hash(cid + 5.1)) + h * 40.0);
      float sz = size * (0.5 + 1.2 * hash(cid + 8.9) * hash(cid + 8.9));
      acc += tw * exp(-dd * dd / (sz * sz)) * (0.4 + 0.6 * h / max(density, 0.001));
    }
  }
  return acc;
}
vec4 galaxyRender(vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, uP_camDist);
  vec3 rd = normalize(vec3(uv, -uP_focal));
  float t = uP_churn;
  float spin = uP_spin;
  float ct = cos(uP_tilt);
  float st = sin(uP_tilt);
  float cs = cos(spin);
  float sn = sin(spin);
  vec3 acc = vec3(0.0);
  vec3 T = vec3(1.0);
  vec3 absorb = vec3(0.7, 1.0, 1.5) * uP_absorb;
  float z = max(uP_camDist - uP_envRadius * 1.05, 0.0);
  float zEnd = uP_camDist + uP_envRadius * 1.05;
  float dt = (zEnd - z) / float(STEPS);
  z += dt * hash(fragCoord * 0.37);
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * z;
    float env = 1.0 - smoothstep(uP_envRadius * 0.92, uP_envRadius, length(p));
    if (env > 0.001) {
      vec3 g = vec3(p.x, p.y * ct - p.z * st, p.y * st + p.z * ct);
      g = vec3(g.x * cs - g.z * sn, g.y, g.x * sn + g.z * cs);
      float arm = 0.0;
      float rho = 0.0;
      float d = galaxy(g / uP_envRadius, t, arm, rho) * env;
      vec3 ramp = mix(uC_inner, uC_outer, smoothstep(0.12, uP_hueReach, rho));
      float coreW = exp(-rho * rho * uP_bulge * 0.6);
      vec3 emit = mix(ramp, uC_core, coreW) * (0.6 + 0.6 * arm);
      acc += T * d * emit * dt;
      T *= exp(-d * absorb * dt);
    }
    z += dt;
    if (T.g < 0.004 || z > zEnd) break;
  }
  return vec4(acc, 1.0 - T.g);
}
void main() {
  float wave = 0.5 + 0.5 * cos(uP_beat);
  galDensity = uP_density * (1.0 + 0.35 * uInput);
  galCore = uP_core * (1.0 + 0.7 * uOutput) * (1.0 + uP_pulse * wave);
  galFalloff = uP_falloff / (1.0 + uP_breathe * wave);
  vec4 acc = galaxyRender(gl_FragCoord.xy);
  {
    vec3 ro = vec3(0.0, 0.0, uP_camDist);
    vec3 rd = normalize(vec3(orbUV(), -uP_focal));
    float ct = cos(uP_tilt);
    float st = sin(uP_tilt);
    vec3 N = vec3(0.0, ct, st);
    float denom = dot(N, rd);
    if (abs(denom) > 1e-4) {
      float th = -dot(N, ro) / denom;
      vec3 q = ro + rd * th;
      if (th > 0.0 && dot(q, q) < uP_envRadius * uP_envRadius * 0.9) {
        vec3 g = vec3(q.x, q.y * ct - q.z * st, q.y * st + q.z * ct) / uP_envRadius;
        float cs = cos(uP_spin);
        float sn = sin(uP_spin);
        vec2 gp = vec2(g.x * cs - g.z * sn, g.x * sn + g.z * cs);
        float rho = length(gp);
        float phi = rho > 1e-4 ? atan(gp.y, gp.x) : 0.0;
        float armW = 0.5 + 0.5 * cos(phi * uP_arms - uP_wind * log(max(rho, 0.02)));
        float sf = starField(gp * uP_starScale, uP_starDensity * (0.3 + 0.7 * armW), 0.12, uP_twinkle);
        float veil = 1.0 - acc.a;
        acc.rgb += vec3(1.0, 0.97, 0.9) * sf * uP_stars * exp(-rho * 1.5) * (0.25 + 0.75 * veil);
      }
    }
  }
  vec3 col = tanh3(acc.rgb / max(uP_exposure, 0.01));
  col = pow(clamp(col, 0.0, 1.0), vec3(uP_contrast));
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uP_saturation);
  col *= uC_tint;
  float peak = max(col.r, max(col.g, col.b));
  float a = clamp(peak * uP_alphaGain, 0.0, 1.0);
  col += uC_deep * uP_fill;
  a = max(a, uP_fill);
  vec3 mrd = normalize(vec3(orbUV(), -uP_focal));
  float closest = length(cross(vec3(0.0, 0.0, uP_camDist), mrd));
  float band = mix(0.35, 0.012, clamp(uP_edge, 0.0, 1.0));
  float mask = 1.0 - smoothstep(uP_envRadius * (1.0 - band), uP_envRadius * 1.005, closest);
  col *= mask;
  a *= mask;
  float fres = smoothstep(uP_envRadius * 0.7, uP_envRadius, closest);
  col += uC_rim * uP_rim * fres * fres * mask;
  float r2d = length(orbUV());
  float fade = 1.0 - smoothstep(uP_edgeFade, 1.0, r2d);
  col *= fade;
  a *= fade;
  gl_FragColor = vec4(col, a);
}
`,
  params: [
    { key: 'spin', label: 'Disc turn', min: 0, max: 3, step: 0.01, standard: 0.06, isRate: true },
    { key: 'churn', label: 'Gas churn', min: 0, max: 5, step: 0.02, standard: 0.25, isRate: true },
    { key: 'beat', label: 'Core beat', min: 0, max: 12, step: 0.05, standard: 0.8, isRate: true },
    {
      key: 'twinkle',
      label: 'Twinkle rate',
      min: 0,
      max: 12,
      step: 0.05,
      standard: 1.2,
      isRate: true,
    },
    { key: 'camDist', label: 'Camera distance', min: 1, max: 50, step: 0.3, standard: 7 },
    { key: 'focal', label: 'Lens', min: 0.15, max: 15, step: 0.05, standard: 2.25 },
    { key: 'envRadius', label: 'Envelope radius', min: 0.15, max: 15, step: 0.1, standard: 2.6 },
    { key: 'tilt', label: 'Tilt (0 edge-on)', min: 0, max: 1.5, step: 0.01, standard: 0.85 },
    { key: 'arms', label: 'Arm count', min: 1, max: 6, step: 1, standard: 2 },
    { key: 'wind', label: 'Arm winding', min: 0, max: 8, step: 0.05, standard: 3.4 },
    { key: 'ragged', label: 'Arm fray', min: 0, max: 12, step: 0.05, standard: 3 },
    { key: 'armSharp', label: 'Arm sharpness', min: 0.3, max: 8, step: 0.05, standard: 2.2 },
    { key: 'falloff', label: 'Disc falloff', min: 0.3, max: 12, step: 0.05, standard: 1.7 },
    { key: 'thick', label: 'Disc thickness', min: 0.01, max: 1, step: 0.005, standard: 0.035 },
    { key: 'bulge', label: 'Core tightness', min: 2, max: 200, step: 1, standard: 40 },
    { key: 'core', label: 'Core density', min: 0, max: 20, step: 0.1, standard: 5 },
    { key: 'turbScale', label: 'Turbulence scale', min: 0.5, max: 30, step: 0.1, standard: 9 },
    { key: 'threshold', label: 'Clumping', min: 0, max: 1, step: 0.01, standard: 0.35 },
    { key: 'density', label: 'Gas density', min: 0.1, max: 40, step: 0.1, standard: 14 },
    { key: 'absorb', label: 'Dust absorption', min: 0, max: 20, step: 0.1, standard: 3.5 },
    { key: 'stars', label: 'Stars', min: 0, max: 10, step: 0.05, standard: 1.2 },
    { key: 'starDensity', label: 'Star density', min: 0, max: 1, step: 0.01, standard: 0.5 },
    { key: 'starScale', label: 'Star scale', min: 5, max: 200, step: 1, standard: 48 },
    { key: 'hueReach', label: 'Hue reach', min: 0.15, max: 1.5, step: 0.01, standard: 0.6 },
    { key: 'pulse', label: 'Beat depth', min: 0, max: 3, step: 0.01, standard: 0.2 },
    { key: 'breathe', label: 'Disc breathing', min: 0, max: 2, step: 0.01, standard: 0 },
    { key: 'exposure', label: 'Exposure', min: 0.05, max: 50, step: 0.05, standard: 1.1 },
    { key: 'contrast', label: 'Contrast', min: 0.15, max: 6, step: 0.05, standard: 1.15 },
    { key: 'saturation', label: 'Saturation', min: 0, max: 4, step: 0.02, standard: 1.35 },
    { key: 'alphaGain', label: 'Alpha gain', min: 0.05, max: 15, step: 0.1, standard: 2 },
    { key: 'fill', label: 'Night fill', min: 0, max: 1, step: 0.01, standard: 0.85 },
    { key: 'rim', label: 'Rim light', min: 0, max: 3, step: 0.015, standard: 0.35 },
    { key: 'edge', label: 'Edge sharpness', min: 0, max: 1, step: 0.01, standard: 1 },
    { key: 'edgeFade', label: 'Halo falloff', min: 0.1, max: 3, step: 0.015, standard: 0.98 },
  ],
  colours: [
    { key: 'tint', label: 'Tint', standard: '#ffffff' },
    { key: 'core', label: 'Core', standard: '#fff3d6' },
    { key: 'inner', label: 'Inner arms', standard: '#7fb4ff' },
    { key: 'outer', label: 'Outer arms', standard: '#c46bff' },
    { key: 'deep', label: 'Night', standard: '#04050f' },
    { key: 'rim', label: 'Rim', standard: '#8fb0ff' },
  ],
};

export { GALAXY };
