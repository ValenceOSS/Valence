const FOR_THE_OWNER: readonly { method: string; path: RegExp }[] = [
  { method: 'PATCH', path: /^\/api\/account$/u },
  { method: 'PUT', path: /^\/api\/account\/photo$/u },
  { method: 'DELETE', path: /^\/api\/account\/photo$/u },
  { method: 'POST', path: /^\/api\/account\/onboarding$/u },
  { method: '*', path: /^\/api\/account\/devices(\/.*)?$/u },
  { method: 'POST', path: /^\/api\/profiles$/u },
  { method: '*', path: /^\/api\/keys(\/.*)?$/u },
  { method: 'POST', path: /^\/api\/setup-links\/password$/u },
];

export { FOR_THE_OWNER };
