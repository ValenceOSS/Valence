import { createPrivateKey, sign } from 'node:crypto';

/**
 * Signs some bytes with an Ed25519 private key, which is how a package or a catalogue is vouched
 * for by whoever publishes it.
 *
 * @param bytes - The exact bytes being published.
 * @param privateKeyPem - The Ed25519 private key, as PKCS #8 PEM.
 * @returns The signature, as base64.
 */
const signBytes = (bytes: Uint8Array, privateKeyPem: string): string =>
  sign(null, bytes, createPrivateKey(privateKeyPem)).toString('base64');

export { signBytes };
