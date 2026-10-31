import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { CredentialRecord } from '@ValenceServer/plugins/store/PluginStore';
import { checkRouteSignIn } from './checkRouteSignIn';
import type { SignInAsked } from './checkRouteSignIn';
import { hashOfSecret } from './hashOfSecret';

const SECRET = 'q8Zr1VbW3nK0yTf6LmP2sXhD';

const SAM: CredentialRecord = {
  id: 'c1',
  pluginId: 'music',
  profileId: 'sam',
  login: 'sam',
  label: 'Phone',
  secretHash: hashOfSecret(SECRET),
  sealedSecret: `sealed:${SECRET}`,
  createdAt: '2026-10-31T10:00:00.000Z',
  lastUsedAt: null,
};

const LOOKUPS = {
  byLogin: (login: string) => Promise.resolve(login === 'sam' ? SAM : null),
  bySecret: (hash: string) => Promise.resolve(hash === SAM.secretHash ? SAM : null),
  open: (sealed: string) => (sealed.startsWith('sealed:') ? sealed.slice(7) : null),
};

const asking = (
  query: Record<string, string[]> = {},
  authorization: string | null = null,
): SignInAsked => ({ authorization, query });

const md5 = (text: string): string => createHash('md5').update(text).digest('hex');

describe('checkRouteSignIn', () => {
  it('signs in with a bearer token, a basic login, a key in the query and a salted token', async () => {
    const basic = `Basic ${Buffer.from(`sam:${SECRET}`).toString('base64')}`;

    await expect(
      checkRouteSignIn([{ kind: 'bearer' }], asking({}, `Bearer ${SECRET}`), LOOKUPS),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
    await expect(
      checkRouteSignIn([{ kind: 'basic' }], asking({}, basic), LOOKUPS),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
    await expect(
      checkRouteSignIn(
        [{ kind: 'query', secret: 'apiKey' }],
        asking({ apiKey: [SECRET] }),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
    await expect(
      checkRouteSignIn(
        [{ kind: 'saltedMd5', login: 'u', token: 't', salt: 's' }],
        asking({ u: ['sam'], t: [md5(`${SECRET}abcdef`)], s: ['abcdef'] }),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
  });

  it('reads the scheme of an Authorization header whatever its case', async () => {
    await expect(
      checkRouteSignIn([{ kind: 'bearer' }], asking({}, `bearer ${SECRET}`), LOOKUPS),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
  });

  it('reads a secret sent as hex after the prefix the route names', async () => {
    const hex = `enc:${Buffer.from(SECRET).toString('hex')}`;

    await expect(
      checkRouteSignIn(
        [{ kind: 'query', login: 'u', secret: 'p', hexPrefix: 'enc:' }],
        asking({ u: ['sam'], p: [hex] }),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
  });

  it('refuses a wrong secret, a secret under another login and a salted token with a short salt', async () => {
    const query = [{ kind: 'query' as const, login: 'u', secret: 'p' }];

    await expect(
      checkRouteSignIn(query, asking({ u: ['sam'], p: ['wrong'] }), LOOKUPS),
    ).resolves.toEqual({ kind: 'refused' });
    await expect(
      checkRouteSignIn(query, asking({ u: ['alex'], p: [SECRET] }), LOOKUPS),
    ).resolves.toEqual({ kind: 'refused' });
    await expect(checkRouteSignIn(query, asking({ p: [SECRET] }), LOOKUPS)).resolves.toEqual({
      kind: 'refused',
    });
    await expect(
      checkRouteSignIn(
        [{ kind: 'saltedMd5', login: 'u', token: 't', salt: 's' }],
        asking({ u: ['sam'], t: [md5(`${SECRET}ab`)], s: ['ab'] }),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'refused' });
    await expect(
      checkRouteSignIn([{ kind: 'basic' }], asking({}, 'Basic bm9jb2xvbg=='), LOOKUPS),
    ).resolves.toEqual({ kind: 'refused' });
  });

  it('never lets a wrong credential in as nobody on a route anybody may call', async () => {
    await expect(
      checkRouteSignIn(
        [{ kind: 'bearer' }, { kind: 'public' }],
        asking({}, 'Bearer wrong'),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'refused' });
    await expect(
      checkRouteSignIn([{ kind: 'bearer' }, { kind: 'public' }], asking(), LOOKUPS),
    ).resolves.toEqual({ kind: 'nobody' });
  });

  it('says a request carried nothing where the route needs a credential', async () => {
    await expect(
      checkRouteSignIn(
        [{ kind: 'bearer' }, { kind: 'query', secret: 'apiKey' }],
        asking({ other: ['x'] }),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'missing' });
  });

  it('tries each way in turn, so a later way decides where an earlier one is not used', async () => {
    await expect(
      checkRouteSignIn(
        [
          { kind: 'query', login: 'u', secret: 'p' },
          { kind: 'saltedMd5', login: 'u', token: 't', salt: 's' },
        ],
        asking({ u: ['sam'], t: [md5(`${SECRET}123456`)], s: ['123456'] }),
        LOOKUPS,
      ),
    ).resolves.toEqual({ kind: 'person', credential: SAM });
  });
});
