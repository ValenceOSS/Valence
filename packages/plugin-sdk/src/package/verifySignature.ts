import { createPublicKey, verify } from 'node:crypto';

/**
 * Whether some bytes carry a valid Ed25519 signature from a given public key. Anything malformed
 * is simply not valid, rather than an error, so a bad signature can never be mistaken for an
 * absent check.
 *
 * @param bytes - The exact bytes that were published.
 * @param signature - The signature, as base64.
 * @param publicKeyPem - The publisher's Ed25519 public key, as SPKI PEM.
 * @returns Whether the signature holds.
 */
const verifySignature = (bytes: Uint8Array, signature: string, publicKeyPem: string): boolean => {
  try {
    const key = createPublicKey(publicKeyPem);

    return key.asymmetricKeyType === 'ed25519' && verify(null, bytes, key, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
};

export { verifySignature };
