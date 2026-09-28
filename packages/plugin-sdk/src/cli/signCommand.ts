import { readFileSync, writeFileSync } from 'node:fs';
import { signBytes } from '@ValenceSDK/package/signBytes';

/**
 * Signs a file with an Ed25519 private key, writing the signature beside it as `<file>.sig`.
 *
 * @param path - The file to sign.
 * @param privateKeyPem - The private key, as PKCS #8 PEM.
 * @returns Where the signature was written.
 */
const signCommand = (path: string, privateKeyPem: string): string => {
  const signaturePath = `${path}.sig`;

  writeFileSync(signaturePath, `${signBytes(readFileSync(path), privateKeyPem)}\n`);

  return signaturePath;
};

export { signCommand };
