import { describe, expect, it } from 'vitest';
import { makeServerKey } from './makeServerKey';

describe('makeServerKey', () => {
  it('makes an Ed25519 pair, a different one each time', () => {
    const first = makeServerKey();
    const second = makeServerKey();

    expect(JSON.parse(first.publicKey)).toMatchObject({ kty: 'OKP', crv: 'Ed25519' });
    expect(JSON.parse(first.privateKey)).toHaveProperty('d');
    expect(first.publicKey).not.toBe(second.publicKey);
  });
});
