const AUTH_FOR_EVERY_PROFILE: readonly RegExp[] = [
  /^\/api\/auth\/get-session$/u,
  /^\/api\/auth\/sign-out$/u,
  /^\/api\/auth\/sign-in\//u,
  /^\/api\/auth\/two-factor\/verify-/u,
  /^\/api\/auth\/two-factor\/send-otp$/u,
  /^\/api\/auth\/passkey\/generate-authenticate-options$/u,
  /^\/api\/auth\/passkey\/verify-authentication$/u,
  /^\/api\/auth\/multi-session\//u,
  /^\/api\/auth\/device(\/.*)?$/u,
  /^\/api\/auth\/reset-password(\/.*)?$/u,
  /^\/api\/auth\/request-password-reset$/u,
  /^\/api\/auth\/forget-password$/u,
  /^\/api\/auth\/token$/u,
  /^\/api\/auth\/jwks$/u,
  /^\/api\/auth\/callback\//u,
  /^\/api\/auth\/oauth2\/callback\//u,
];

export { AUTH_FOR_EVERY_PROFILE };
