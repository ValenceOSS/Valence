const DEMO_BLOCKS = [
  { method: 'GET', path: '/api/auth/list-sessions' },
  { method: 'POST', path: '/api/auth/revoke-session' },
  { method: 'POST', path: '/api/auth/revoke-sessions' },
  { method: 'POST', path: '/api/auth/revoke-other-sessions' },
  { method: 'DELETE', path: '/api/account/devices/:id' },
  { method: 'POST', path: '/api/account/devices/end-others' },
  { method: 'POST', path: '/api/profiles' },
  { method: 'DELETE', path: '/api/profiles/:profileId' },
  { method: 'PATCH', path: '/api/account' },
  { method: 'POST', path: '/api/account/onboarding' },
] as const;

export { DEMO_BLOCKS };
