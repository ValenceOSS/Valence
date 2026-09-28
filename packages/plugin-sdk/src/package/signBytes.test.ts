import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { signBytes } from './signBytes';
import { verifySignature } from './verifySignature';

const pair = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
};

describe('signBytes and verifySignature', () => {
  const bytes = new TextEncoder().encode('a plugin');

  it('signs bytes so the matching public key verifies them', () => {
    const keys = pair();

    expect(verifySignature(bytes, signBytes(bytes, keys.privateKey), keys.publicKey)).toBe(true);
  });

  it('refuses bytes changed after signing', () => {
    const keys = pair();
    const signature = signBytes(bytes, keys.privateKey);

    expect(verifySignature(new TextEncoder().encode('a plugin!'), signature, keys.publicKey)).toBe(false);
  });

  it('refuses a signature from another key', () => {
    const keys = pair();

    expect(verifySignature(bytes, signBytes(bytes, pair().privateKey), keys.publicKey)).toBe(false);
  });

  it('treats a malformed key or signature as not valid rather than failing', () => {
    const keys = pair();

    expect(verifySignature(bytes, 'not base64 at all', keys.publicKey)).toBe(false);
    expect(verifySignature(bytes, signBytes(bytes, keys.privateKey), 'not a key')).toBe(false);
  });

  it('refuses a key that is not Ed25519', () => {
    const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

    expect(
      verifySignature(bytes, 'AAAA', publicKey.export({ type: 'spki', format: 'pem' }).toString()),
    ).toBe(false);
  });
});
