import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Makes a new Ed25519 key pair for signing plugins, writing the private key readable by its owner
 * alone and the public key beside it.
 *
 * @param outDirectory - Where to write the keys.
 * @param keyId - What to call the pair, such as `my-plugins-2026`.
 * @returns Where the private and the public key were written.
 */
const keygenCommand = (
  outDirectory: string,
  keyId: string,
): { privateKey: string; publicKey: string } => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const paths = {
    privateKey: join(outDirectory, `${keyId}.pem`),
    publicKey: join(outDirectory, `${keyId}.pub.pem`),
  };

  mkdirSync(outDirectory, { recursive: true });
  writeFileSync(paths.privateKey, privateKey.export({ type: 'pkcs8', format: 'pem' }), {
    mode: 0o600,
  });
  writeFileSync(paths.publicKey, publicKey.export({ type: 'spki', format: 'pem' }));

  return paths;
};

export { keygenCommand };
