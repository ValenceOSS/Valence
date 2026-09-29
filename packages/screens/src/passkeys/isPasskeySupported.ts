import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Whether this browser's page can make and use passkeys itself, which needs both the credential
 * machinery and a secure context — the machinery exists over plain HTTP but refuses to do anything.
 *
 * @returns Whether the page can.
 */
const isThePageAble = (): boolean =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof window.PublicKeyCredential === 'function';

/**
 * Whether somebody can sign in with a passkey here, however this client goes about it.
 *
 * @returns Whether passkeys can be offered at the way in.
 */
const isPasskeySupported = (): boolean => {
  const passkeys = platformInUse().passkeys();

  return passkeys.kind === 'in-the-page' ? isThePageAble() : passkeys.kind !== 'none';
};

/**
 * Says why a passkey cannot be added from this screen — no support at all, a page not served
 * securely, or a client whose passkeys are added somewhere else — so that the account page explains
 * rather than silently omitting them.
 *
 * @returns The reason, or null where one can be added here.
 */
const describePasskeyUnavailability = (): string | null => {
  const passkeys = platformInUse().passkeys();

  if (passkeys.kind === 'none') {
    return passkeys.why;
  }

  if (passkeys.kind === 'through-a-sign-in-page') {
    return 'Passkeys are added from Valence in your browser.';
  }

  if (passkeys.kind === 'through-the-system') {
    return null;
  }

  if (typeof window === 'undefined') {
    return 'Passkeys are not available here.';
  }

  if (!window.isSecureContext) {
    return 'Passkeys need a secure connection. Reach Valence over HTTPS, or on localhost, to add one.';
  }

  if (typeof window.PublicKeyCredential !== 'function') {
    return 'This browser does not support passkeys.';
  }

  return null;
};

export { isPasskeySupported, describePasskeyUnavailability };
