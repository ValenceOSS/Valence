const DEMO_BLOCKS = [
  { method: 'GET', path: '/api/auth/list-sessions' },
  { method: 'POST', path: '/api/auth/revoke-session' },
  { method: 'POST', path: '/api/auth/revoke-sessions' },
  { method: 'POST', path: '/api/auth/revoke-other-sessions' },
  { method: 'GET', path: '/api/account/devices' },
  { method: 'DELETE', path: '/api/account/devices/:id' },
  { method: 'POST', path: '/api/account/devices/end-others' },
  { method: 'POST', path: '/api/profiles' },
  { method: 'DELETE', path: '/api/profiles/:profileId' },
  { method: 'PATCH', path: '/api/account' },
  { method: 'POST', path: '/api/account/onboarding' },
  { method: 'GET', path: '/api/auth/two-factor/*' },
  { method: 'POST', path: '/api/auth/two-factor/*' },
  { method: 'GET', path: '/api/auth/passkey/*' },
  { method: 'POST', path: '/api/auth/passkey/*' },
] as const;

export { DEMO_BLOCKS };
