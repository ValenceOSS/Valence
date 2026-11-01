import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifiesSignature } from './verifiesSignature';

describe('verifiesSignature', () => {
  it('verifies an Ed25519 signature against a key in hex, as Discord gives it, or as PEM', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
    const pem = publicKey.export({ format: 'pem', type: 'spki' }).toString();
    const signature = sign(null, Buffer.from('1700000000{"type":1}'), privateKey);

    expect(await verifiesSignature('ed25519', raw, '1700000000{"type":1}', signature)).toBe(true);
    expect(await verifiesSignature('ed25519', pem, '1700000000{"type":1}', signature)).toBe(true);
    expect(await verifiesSignature('ed25519', raw, '1700000000{"type":2}', signature)).toBe(false);
    expect(await verifiesSignature('ed25519', raw, 'anything', Buffer.from('short'))).toBe(false);
  });

  it('verifies RSA and ECDSA signatures over SHA-256', async () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pemOf = (key: typeof rsa.publicKey) =>
      key.export({ format: 'pem', type: 'spki' }).toString();

    expect(
      await verifiesSignature(
        'rsa-sha256',
        pemOf(rsa.publicKey),
        'signed',
        sign('sha256', Buffer.from('signed'), rsa.privateKey),
      ),
    ).toBe(true);
    expect(
      await verifiesSignature(
        'ecdsa-sha256',
        pemOf(ec.publicKey),
        'signed',
        sign('sha256', Buffer.from('signed'), ec.privateKey),
      ),
    ).toBe(true);
  });

  it('verifies an ECDSA signature given raw, as JSON Web Tokens carry it', async () => {
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pem = ec.publicKey.export({ format: 'pem', type: 'spki' }).toString();
    const raw = sign('sha256', Buffer.from('signed'), {
      key: ec.privateKey,
      dsaEncoding: 'ieee-p1363',
    });

    expect(raw).toHaveLength(64);
    expect(await verifiesSignature('ecdsa-sha256', pem, 'signed', raw)).toBe(true);
    expect(await verifiesSignature('ecdsa-sha256', pem, 'changed', raw)).toBe(false);
  });

  it('refuses a key it cannot read, or one of another kind than named', async () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = rsa.publicKey.export({ format: 'pem', type: 'spki' }).toString();

    await expect(verifiesSignature('ed25519', 'not a key', 'x', Buffer.alloc(64))).rejects.toThrow(
      'could not be read',
    );
    await expect(verifiesSignature('ed25519', pem, 'x', Buffer.alloc(64))).rejects.toThrow(
      'not an ed25519 key',
    );
  });
});
