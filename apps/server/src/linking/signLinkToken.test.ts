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
    expect(claims.sub).toBeUndefined();
  });

  it('names a person by pseudonym, and by name only where it is given', async () => {
    const { privateKey } = makeServerKey();
    const named = decodeJwt(
      await signLinkToken({
        from: 'anime',
        to: 'films',
        privateKey,
        person: { pseudonym: 'p1', name: 'Sam' },
      }),
    );
    const unnamed = decodeJwt(
      await signLinkToken({
        from: 'anime',
        to: 'films',
        privateKey,
        person: { pseudonym: 'p1', name: null },
      }),
    );

    expect(named).toMatchObject({ sub: 'p1', name: 'Sam' });
    expect(unnamed.sub).toBe('p1');
    expect(unnamed.name).toBeUndefined();
  });
});
