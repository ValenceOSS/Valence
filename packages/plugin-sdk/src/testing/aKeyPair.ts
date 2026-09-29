import { generateKeyPairSync } from 'node:crypto';

/**
 * A fresh Ed25519 key pair to sign and check things with in a test, as the PEM text the SDK reads.
 *
 * @returns The private key, to sign with, and the public key, to check with.
 */
const aKeyPair = (): { privateKey: string; publicKey: string } => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
};

export { aKeyPair };
