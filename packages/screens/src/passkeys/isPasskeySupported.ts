import { say } from '@ValenceI18n/say';

/**
 * Whether this browser can use passkeys at all, which needs both the credential machinery and a
 * secure context — the machinery exists over plain HTTP but refuses to do anything.
 *
 * @returns Whether passkeys can be offered.
 */
const isPasskeySupported = (): boolean =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof window.PublicKeyCredential === 'function';

/**
 * Says why passkeys cannot be offered here — no support at all, or a page not served securely — so
 * that the account page explains rather than silently omitting them.
 *
 * @returns The reason, or null where they are available.
 */
const describePasskeyUnavailability = (): string | null => {
  if (typeof window === 'undefined') {
    return say('screens.describePasskeyUnavailability.notAvailable');
  }

  if (!window.isSecureContext) {
    return say('screens.describePasskeyUnavailability.needsSecureConnection');
  }

  if (typeof window.PublicKeyCredential !== 'function') {
    return say('screens.describePasskeyUnavailability.notSupported');
  }

  return null;
};

export { isPasskeySupported, describePasskeyUnavailability };
