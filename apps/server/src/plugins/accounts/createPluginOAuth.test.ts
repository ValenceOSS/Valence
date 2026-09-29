import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
import { createPluginOAuth } from './createPluginOAuth';
import type { AccountProvider } from '@ValenceSDK/manifest/AccountProviderSchema';

const PROVIDER: AccountProvider = {
  id: 'anilist',
  name: 'AniList',
  authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
  tokenUrl: 'https://anilist.co/api/v2/oauth/token',
  scopes: ['read', 'write'],
  clientIdSetting: 'clientId',
};

const CREDENTIALS = { clientId: 'client-1', clientSecret: 'shh' };

const build = (answers: { status: number; text: string }[]) => {
  const store = createMemoryPluginStore();
  const exchange = vi.fn(() =>
    Promise.resolve(answers.shift() ?? { status: 500, text: 'no answer queued' }),
  );
  let clock = 1_000_000;
  let counter = 0;
  const oauth = createPluginOAuth({
    redirectUri: 'https://valence.home/api/plugins/oauth/callback',
    store,
    seal: (secret) => `sealed:${secret}`,
    open: (sealed) => (sealed.startsWith('sealed:') ? sealed.slice(7) : null),
    exchange,
    now: () => clock,
    random: (bytes) => {
      counter += 1;

      return Buffer.alloc(bytes, counter);
    },
  });

  return {
    store,
    exchange,
    oauth,
    advance: (milliseconds: number) => {
      clock += milliseconds;
    },
  };
};

const begin = (oauth: ReturnType<typeof build>['oauth'], browser = 'browser-1') =>
  new URL(
    oauth.begin({
      pluginId: 'anime',
      provider: PROVIDER,
      credentials: CREDENTIALS,
      profileId: 'p1',
      browser,
      returnTo: '/account/plugins/anime/home',
    }),
  );

describe('connecting an outside account to a plugin', () => {
  it('sends somebody to the provider with a state and a PKCE challenge', () => {
    const { oauth } = build([]);
    const address = begin(oauth);

    expect(address.origin + address.pathname).toBe(PROVIDER.authorizeUrl);
    expect(address.searchParams.get('client_id')).toBe('client-1');
    expect(address.searchParams.get('redirect_uri')).toBe(
      'https://valence.home/api/plugins/oauth/callback',
    );
    expect(address.searchParams.get('code_challenge_method')).toBe('S256');
    expect(address.searchParams.get('scope')).toBe('read write');
    expect(address.searchParams.get('state')).not.toBeNull();
  });

  it('trades the code for tokens and keeps them sealed', async () => {
    const { oauth, exchange, store } = build([
      {
        status: 200,
        text: JSON.stringify({ access_token: 'at', refresh_token: 'rt', expires_in: 3600 }),
      },
    ]);
    const address = begin(oauth);
    const state = address.searchParams.get('state') ?? '';
    const finished = await oauth.finish({ state, code: 'the-code', browser: 'browser-1' });

    expect(finished).toEqual({
      ok: true,
      pluginId: 'anime',
      profileId: 'p1',
      provider: 'anilist',
      returnTo: '/account/plugins/anime/home',
    });

    const verifier = Buffer.alloc(48, 2).toString('base64url');

    expect(address.searchParams.get('code_challenge')).toBe(
      createHash('sha256').update(verifier).digest('base64url'),
    );
    expect(exchange).toHaveBeenCalledWith('anime', PROVIDER.tokenUrl, {
      grant_type: 'authorization_code',
      code: 'the-code',
      redirect_uri: 'https://valence.home/api/plugins/oauth/callback',
      code_verifier: verifier,
      client_id: 'client-1',
      client_secret: 'shh',
    });

    const kept = await store.readConnection('anime', 'p1', 'anilist');

    expect(kept).toMatchObject({ accessToken: 'sealed:at', refreshToken: 'sealed:rt' });
    expect(await oauth.tokensFor('anime', 'p1', PROVIDER, CREDENTIALS)).toEqual({
      accessToken: 'at',
      expiresAt: kept?.expiresAt,
      account: null,
    });
  });

  it('refuses a state it never gave, one that expired, and one from another session', async () => {
    const { oauth, advance } = build([]);

    expect(await oauth.finish({ state: 'made-up', code: 'c', browser: 'browser-1' })).toMatchObject(
      {
        ok: false,
        problem: 'That connection had expired. Try again.',
      },
    );

    const stale = begin(oauth).searchParams.get('state') ?? '';

    advance(11 * 60 * 1000);
    expect(await oauth.finish({ state: stale, code: 'c', browser: 'browser-1' })).toMatchObject({
      ok: false,
    });

    const other = begin(oauth).searchParams.get('state') ?? '';

    expect(await oauth.finish({ state: other, code: 'c', browser: 'browser-2' })).toMatchObject({
      ok: false,
      problem: 'That connection was started somewhere else.',
    });
    expect(await oauth.finish({ state: other, code: 'c', browser: 'browser-1' })).toMatchObject({
      ok: false,
      problem: 'That connection had expired. Try again.',
    });
  });

  it('says so when the provider refuses the code or answers nonsense', async () => {
    const refused = build([{ status: 400, text: '{"error":"invalid_grant"}' }]);

    expect(
      await refused.oauth.finish({
        state: begin(refused.oauth).searchParams.get('state') ?? '',
        code: 'c',
        browser: 'browser-1',
      }),
    ).toMatchObject({ ok: false, problem: 'AniList did not accept the connection.' });

    const nonsense = build([{ status: 200, text: 'not json' }]);

    expect(
      await nonsense.oauth.finish({
        state: begin(nonsense.oauth).searchParams.get('state') ?? '',
        code: 'c',
        browser: 'browser-1',
      }),
    ).toMatchObject({ ok: false });
  });

  it('refreshes an expired token, and gives up when the refresh is refused', async () => {
    const { oauth, advance, exchange } = build([
      {
        status: 200,
        text: JSON.stringify({ access_token: 'at1', refresh_token: 'rt1', expires_in: 120 }),
      },
      { status: 200, text: JSON.stringify({ access_token: 'at2', expires_in: 120 }) },
      { status: 401, text: '{}' },
    ]);

    await oauth.finish({
      state: begin(oauth).searchParams.get('state') ?? '',
      code: 'c',
      browser: 'browser-1',
    });
    advance(100 * 1000);

    expect(await oauth.tokensFor('anime', 'p1', PROVIDER, CREDENTIALS)).toMatchObject({
      accessToken: 'at2',
    });
    expect(exchange).toHaveBeenLastCalledWith('anime', PROVIDER.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: 'rt1',
      client_id: 'client-1',
      client_secret: 'shh',
    });

    advance(100 * 1000);

    expect(await oauth.tokensFor('anime', 'p1', PROVIDER, CREDENTIALS)).toBeNull();
  });

  it('answers nothing for somebody who never connected, and for a token that will not open', async () => {
    const { oauth, store } = build([]);

    expect(await oauth.tokensFor('anime', 'p1', PROVIDER, CREDENTIALS)).toBeNull();

    await store.saveConnection({
      pluginId: 'anime',
      profileId: 'p1',
      provider: 'anilist',
      accessToken: 'garbage',
      refreshToken: null,
      expiresAt: null,
      account: null,
    });

    expect(
      await oauth.tokensFor('anime', 'p1', PROVIDER, { clientId: 'c', clientSecret: null }),
    ).toBeNull();
  });

  it('asks a provider with a revocation address to cancel the refresh token, or else the access token', async () => {
    const { oauth, exchange } = build([
      { status: 200, text: '' },
      { status: 503, text: '' },
    ]);
    const revoking = { ...PROVIDER, revokeUrl: 'https://anilist.co/api/v2/oauth/revoke' };
    const connection = {
      pluginId: 'anime',
      profileId: 'p1',
      provider: 'anilist',
      accessToken: 'sealed:at1',
      refreshToken: 'sealed:rt1',
      expiresAt: null,
      account: null,
    };

    expect(await oauth.revoke(connection, revoking, CREDENTIALS)).toBe(true);
    expect(exchange).toHaveBeenLastCalledWith('anime', revoking.revokeUrl, {
      token: 'rt1',
      token_type_hint: 'refresh_token',
      client_id: 'client-1',
      client_secret: 'shh',
    });
    expect(
      await oauth.revoke({ ...connection, refreshToken: null }, revoking, {
        clientId: 'client-1',
        clientSecret: null,
      }),
    ).toBe(false);
    expect(exchange).toHaveBeenLastCalledWith('anime', revoking.revokeUrl, {
      token: 'at1',
      token_type_hint: 'access_token',
      client_id: 'client-1',
    });
    expect(await oauth.revoke(connection, PROVIDER, CREDENTIALS)).toBe(false);
    expect(exchange).toHaveBeenCalledTimes(2);
  });
});
