import { getRandomValues, randomUUID } from 'expo-crypto';

/**
 * Gives this runtime the `crypto` every other one already has.
 *
 * Hermes has no `crypto`, and the application below makes an identifier for this client the way a
 * browser and a desktop client both do — which throws on a television before the first screen is
 * drawn. What is installed is the two members anything here reaches for, backed by the system's own
 * random source.
 *
 * Installed as this module is evaluated rather than on the way up, because the code that needs it
 * runs while modules are still loading.
 */
const giveThisRuntimeCrypto = (): void => {
  if (Reflect.has(globalThis, 'crypto')) {
    return;
  }

  Object.defineProperty(globalThis, 'crypto', {
    value: { getRandomValues, randomUUID },
    configurable: true,
    writable: true,
  });
};

giveThisRuntimeCrypto();

export { giveThisRuntimeCrypto };
