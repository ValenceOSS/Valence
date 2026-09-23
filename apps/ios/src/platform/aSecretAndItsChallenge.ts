import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';

const HOW_MANY_BYTES = 32;

/**
 * Makes a secret this phone keeps, and the challenge made from it that it can send anywhere.
 *
 * @returns The secret, and its sha-256 in hex.
 */
const aSecretAndItsChallenge = async (): Promise<{ secret: string; challenge: string }> => {
  const secret = Array.from(getRandomBytes(HOW_MANY_BYTES), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return { secret, challenge: await digestStringAsync(CryptoDigestAlgorithm.SHA256, secret) };
};

export { aSecretAndItsChallenge };
