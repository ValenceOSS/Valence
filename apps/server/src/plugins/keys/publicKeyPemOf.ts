import { createPublicKey } from 'node:crypto';

/**
 * Reads an Ed25519 public key as somebody would paste it, either as the whole `.pub.pem` file the
 * plugin tool writes or as the one line of base64 between its markers.
 *
 * @param text - The key as given.
 * @returns The key as SPKI PEM, or nothing where it is not an Ed25519 public key.
 */
const publicKeyPemOf = (text: string): string | null => {
  const body = text.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '');

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body)) {
    return null;
  }

  try {
    const key = createPublicKey({ key: Buffer.from(body, 'base64'), format: 'der', type: 'spki' });

    return key.asymmetricKeyType === 'ed25519'
      ? key.export({ type: 'spki', format: 'pem' }).toString()
      : null;
  } catch {
    return null;
  }
};

export { publicKeyPemOf };
