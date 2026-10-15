const WITHOUT_A_PROFILE: readonly { method: string; path: RegExp }[] = [
  { method: 'GET', path: /^\/api\/profiles$/u },
  { method: 'POST', path: /^\/api\/profiles\/[^/]+\/choose$/u },
  { method: 'DELETE', path: /^\/api\/profiles\/chosen$/u },
  { method: 'GET', path: /^\/api\/profiles\/[^/]+\/avatar$/u },
  { method: 'GET', path: /^\/api\/account\/permissions$/u },
  { method: 'GET', path: /^\/api\/account\/onboarding$/u },
  { method: 'GET', path: /^\/api\/account\/avatar$/u },
  { method: 'GET', path: /^\/api\/realtime$/u },
  { method: '*', path: /^\/api\/auth\//u },
];

export { WITHOUT_A_PROFILE };
