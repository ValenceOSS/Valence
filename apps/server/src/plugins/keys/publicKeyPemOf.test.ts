import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { publicKeyPemOf } from './publicKeyPemOf';

const ed25519 = generateKeyPairSync('ed25519')
  .publicKey.export({ type: 'spki', format: 'pem' })
  .toString();

describe('publicKeyPemOf', () => {
  it('reads the whole PEM file, or the line of base64 inside it', () => {
    const line = ed25519.split('\n')[1] ?? '';

    expect(publicKeyPemOf(ed25519)).toBe(ed25519);
    expect(publicKeyPemOf(`  ${line}\n`)).toBe(ed25519);
  });

  it('refuses what is not an Ed25519 public key', () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 })
      .publicKey.export({ type: 'spki', format: 'pem' })
      .toString();

    expect(publicKeyPemOf(rsa)).toBeNull();
    expect(publicKeyPemOf('not a key')).toBeNull();
    expect(publicKeyPemOf('AAAA')).toBeNull();
  });
});
