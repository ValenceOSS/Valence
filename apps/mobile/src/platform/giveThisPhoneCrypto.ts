import { getRandomValues, randomUUID } from 'expo-crypto';

/**
 * Gives this phone the Web Crypto the rest of Valence expects to find.
 *
 * Hermes has no `crypto` global at all — not a missing method, the whole thing — so anything asking
 * for one throws before it can check. A browser and Electron both have it, so the application is
 * written as though everything does, and this is the phone keeping that promise rather than every
 * caller learning which client it is on.
 */
const giveThisPhoneCrypto = (): void => {
  if ('crypto' in globalThis) {
    return;
  }

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { getRandomValues, randomUUID },
  });
};

export { giveThisPhoneCrypto };
