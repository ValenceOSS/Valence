const KEPT_FROM_KEYS: readonly { method: string; path: RegExp }[] = [
  { method: 'PATCH', path: /^\/api\/account$/u },
  { method: 'PUT', path: /^\/api\/account\/photo$/u },
  { method: 'DELETE', path: /^\/api\/account\/photo$/u },
  { method: 'POST', path: /^\/api\/account\/onboarding$/u },
  { method: '*', path: /^\/api\/account\/devices(\/.*)?$/u },
  { method: 'POST', path: /^\/api\/setup-links\/password$/u },
  { method: 'POST', path: /^\/api\/phone\/hand-back$/u },
  { method: '*', path: /^\/api\/calendar\/feed(\/renew)?$/u },
  { method: 'POST', path: /^\/api\/profiles(\/.*)?$/u },
  { method: 'PUT', path: /^\/api\/profiles(\/.*)?$/u },
  { method: 'PATCH', path: /^\/api\/profiles(\/.*)?$/u },
  { method: 'DELETE', path: /^\/api\/profiles(\/.*)?$/u },
];

export { KEPT_FROM_KEYS };
