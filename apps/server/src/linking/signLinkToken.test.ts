import { describe, expect, it } from 'vitest';
import { decodeJwt } from 'jose';
import { signLinkToken } from './signLinkToken';
import { makeServerKey } from './makeServerKey';

describe('signLinkToken', () => {
  it('says who it is from and for, and is good for a minute', async () => {
    const token = await signLinkToken({
      from: 'anime',
      to: 'films',
      privateKey: makeServerKey().privateKey,
    });
    const claims = decodeJwt(token);

    expect(claims).toMatchObject({ iss: 'anime', aud: 'films' });
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(60);
    expect(typeof claims.jti).toBe('string');
  });
});
