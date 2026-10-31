import { createPublicKey, verify } from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { PluginRefusalError } from './PluginRefusalError';

const RAW_ECDSA_LENGTHS = new Set([64, 96, 132]);

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * Reads a public key given as PEM, or for Ed25519 also as the 32 bytes of the key in hex, which is
 * how services such as Discord publish theirs.
 *
 * @param algorithm - What the key signs with.
 * @param publicKey - The key.
 * @returns The key, ready to verify with.
 */
const keyOf = (algorithm: string, publicKey: string): KeyObject => {
  const trimmed = publicKey.trim();

  try {
    return algorithm === 'ed25519' && /^[0-9a-f]{64}$/iu.test(trimmed)
      ? createPublicKey({
          key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(trimmed, 'hex')]),
          format: 'der',
          type: 'spki',
        })
      : createPublicKey(trimmed);
  } catch (error) {
    throw new PluginRefusalError('That public key could not be read.', { cause: error });
  }
};

/**
 * Whether a signature over a message was made with the private half of a public key, by Ed25519,
 * RSA with SHA-256 or ECDSA with SHA-256, worked out away from the server's main thread. An ECDSA
 * signature may be DER, or the raw r and s that JSON Web Tokens and WebCrypto give. A key of another kind than the one named is refused
 * rather than tried.
 *
 * @param algorithm - What the signature was made with.
 * @param publicKey - The signer's public key, as PEM, or hex for Ed25519.
 * @param message - What was signed, as text.
 * @param signature - The signature's bytes.
 * @returns Whether it verifies.
 */
const verifiesSignature = async (
  algorithm: 'ed25519' | 'rsa-sha256' | 'ecdsa-sha256',
  publicKey: string,
  message: string,
  signature: Buffer,
): Promise<boolean> => {
  const key = keyOf(algorithm, publicKey);
  const kind = algorithm === 'ed25519' ? 'ed25519' : algorithm === 'rsa-sha256' ? 'rsa' : 'ec';

  if (key.asymmetricKeyType !== kind) {
    throw new PluginRefusalError(`That public key is not an ${kind} key.`);
  }

  const check = (dsaEncoding: 'der' | 'ieee-p1363'): Promise<boolean> =>
    new Promise((resolve) => {
      try {
        verify(
          algorithm === 'ed25519' ? null : 'sha256',
          Buffer.from(message, 'utf8'),
          { key, dsaEncoding },
          signature,
          (error, isValid) => {
            resolve(error === null && isValid);
          },
        );
      } catch {
        resolve(false);
      }
    });

  return (
    (await check('der')) ||
    (algorithm === 'ecdsa-sha256' &&
      RAW_ECDSA_LENGTHS.has(signature.length) &&
      (await check('ieee-p1363')))
  );
};

export { verifiesSignature };
