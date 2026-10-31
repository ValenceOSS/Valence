import { describe, expect, it, vi } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { BrokerScope } from '@ValenceServer/plugins/broker/BrokerScope';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { createPluginRoutes } from './createPluginRoutes';
import type { RouteAsk } from './createPluginRoutes';

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'music',
  name: 'Music apps',
  version: '1.0.0',
  apiVersion: '^1.4',
  author: { name: 'Tester' },
  description: 'Answers music apps.',
  entry: 'dist/plugin.js',
  permissions: [{ kind: 'routes', public: true }],
  contributes: {
    routes: [
      {
        id: 'rest',
        title: 'Music apps',
        methods: ['GET', 'POST'],
        signIn: [
          { kind: 'query', login: 'u', secret: 'p', hexPrefix: 'enc:' },
          { kind: 'saltedMd5', login: 'u', token: 't', salt: 's' },
        ],
      },
      { id: 'feed', title: 'Feed', methods: ['GET'], signIn: [{ kind: 'public' }] },
    ],
  },
});

const RECORD: InstalledRecord = {
  id: 'music',
  version: '1.0.0',
  trust: 'unsigned',
  manifest: MANIFEST,
  packageBase64: '',
  sha256: 'x',
  isEnabled: true,
  settings: {},
  installedBy: null,
  installedAt: '2026-10-31T00:00:00.000Z',
  updatedAt: '2026-10-31T00:00:00.000Z',
  problem: null,
  previousVersion: null,
};

const SAMS_VIEW: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'sam',
  isAdministrator: false,
  lockedLibraries: ['locked'],
};

const OK = JSON.stringify({ status: 200, contentType: 'application/json', body: '{"ok":true}' });

const build = (answer: () => Promise<string> = () => Promise.resolve(OK)) => {
  let at = Date.parse('2026-10-31T12:00:00Z');
  const store = createMemoryPluginStore();
  const invoke = vi.fn((_plugin: object, _args: object, _scope: BrokerScope) => answer());
  const routes = createPluginRoutes({
    runnable: (pluginId) =>
      Promise.resolve(pluginId === 'music' ? { record: RECORD, code: '' } : null),
    store,
    invoke,
    readProfile: (profileId) =>
      Promise.resolve(
        profileId === 'sam' ? { id: 'sam', name: 'Sam Smith', accountId: 'account-1' } : null,
      ),
    viewerOf: () => Promise.resolve(SAMS_VIEW),
    seal: (secret) => `sealed:${secret}`,
    open: (sealed) => (sealed.startsWith('sealed:') ? sealed.slice(7) : null),
    log: vi.fn(),
    now: () => at,
  });

  return {
    routes,
    store,
    invoke,
    later: (milliseconds: number) => {
      at += milliseconds;
    },
  };
};

const asking = (overrides: Partial<RouteAsk> = {}): RouteAsk => ({
  method: 'GET',
  path: 'ping.view',
  query: {},
  headers: {},
  body: '',
  address: '203.0.113.7',
  ...overrides,
});

const madeFor = async (routes: ReturnType<typeof build>['routes']) => {
  const made = await routes.makeCredential('music', { id: 'sam', name: 'Sam Smith' }, 'Phone');

  if (typeof made === 'string') {
    throw new Error(made);
  }

  return made;
};

describe('createPluginRoutes', () => {
  it('answers as the person whose app password signed the request in, with their locks on', async () => {
    const { routes, invoke } = build();
    const { credential, secret } = await madeFor(routes);

    expect(credential.login).toBe('sam-smith');
    await expect(
      routes.answer('music', 'rest', asking({ query: { u: ['sam-smith'], p: [secret] } })),
    ).resolves.toEqual({
      kind: 'answered',
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
      cacheSeconds: null,
    });
    expect(invoke.mock.calls[0]?.[2]).toEqual({
      kind: 'viewer',
      profileId: 'sam',
      accountId: 'account-1',
      isAdmin: false,
      reads: SAMS_VIEW,
    });
    expect(invoke.mock.calls[0]?.[1]).toMatchObject({
      id: 'rest',
      person: { profileId: 'sam', name: 'Sam Smith' },
    });
  });

  it('keeps every secret and forwarding header from the plugin', async () => {
    const { routes, invoke } = build();
    const { secret } = await madeFor(routes);

    await routes.answer(
      'music',
      'rest',
      asking({
        query: { u: ['sam-smith'], p: [secret], f: ['json'] },
        headers: {
          'user-agent': 'An app',
          cookie: 'session=abc',
          authorization: 'Bearer x',
          'x-forwarded-for': '10.0.0.1',
        },
      }),
    );

    expect(invoke.mock.calls[0]?.[1]).toMatchObject({
      request: { query: { u: ['sam-smith'], f: ['json'] }, headers: { 'user-agent': 'An app' } },
    });
  });

  it('refuses a wrong or missing app password without asking the plugin, and slows down a guesser', async () => {
    const { routes, invoke, later } = build();
    const { secret } = await madeFor(routes);
    const wrong = asking({ query: { u: ['sam-smith'], p: ['wrong'] } });

    await expect(routes.answer('music', 'rest', wrong)).resolves.toEqual({
      kind: 'signInNeeded',
      realm: null,
    });
    await expect(routes.answer('music', 'rest', asking())).resolves.toEqual({
      kind: 'signInNeeded',
      realm: null,
    });
    expect(invoke).not.toHaveBeenCalled();

    await Promise.all(Array.from({ length: 30 }, () => routes.answer('music', 'rest', wrong)));

    await expect(routes.answer('music', 'rest', wrong)).resolves.toEqual({
      kind: 'limited',
      retryAfterSeconds: 600,
    });
    await expect(
      routes.answer('music', 'rest', asking({ query: { u: ['sam-smith'], p: [secret] } })),
    ).resolves.toMatchObject({ kind: 'answered' });
    await expect(
      routes.answer('music', 'rest', asking({ ...wrong, address: '198.51.100.2' })),
    ).resolves.toEqual({ kind: 'signInNeeded', realm: null });

    later(11 * 60_000);

    await expect(routes.answer('music', 'rest', wrong)).resolves.toEqual({
      kind: 'signInNeeded',
      realm: null,
    });
  });

  it('counts the callers of one IPv6 network as one', async () => {
    const { routes } = build();
    const wrong = { query: { u: ['sam-smith'], p: ['wrong'] } };

    await madeFor(routes);

    for (let tries = 0; tries < 20; tries += 1) {
      await routes.answer(
        'music',
        'rest',
        asking({ ...wrong, address: `2001:db8:1:2::${tries.toString(16)}` }),
      );
    }

    await expect(
      routes.answer('music', 'rest', asking({ ...wrong, address: '2001:db8:1:2::ff' })),
    ).resolves.toEqual({ kind: 'limited', retryAfterSeconds: 600 });
    await expect(
      routes.answer('music', 'rest', asking({ ...wrong, address: '2001:db8:1:3::1' })),
    ).resolves.toEqual({ kind: 'signInNeeded', realm: null });
  });

  it('signs in from a posted form, and keeps the password out of the body the plugin is handed', async () => {
    const { routes, invoke } = build();
    const { secret } = await madeFor(routes);

    await expect(
      routes.answer(
        'music',
        'rest',
        asking({
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ u: 'sam-smith', p: secret, id: 'a1' }).toString(),
        }),
      ),
    ).resolves.toMatchObject({ kind: 'answered' });
    expect(invoke.mock.calls[0]?.[1]).toMatchObject({ request: { body: 'u=sam-smith&id=a1' } });
  });

  it('answers HEAD as GET, and passes the plugin only headers it may read', async () => {
    const { routes, invoke } = build();

    await routes.answer(
      'music',
      'feed',
      asking({
        method: 'HEAD',
        headers: { accept: 'application/json', 'x-client-ip': '10.0.0.9', via: 'proxy' },
      }),
    );

    expect(invoke.mock.calls[0]?.[1]).toMatchObject({
      request: { method: 'GET', headers: { accept: 'application/json' } },
    });
  });

  it('answers anybody on a public route as nobody, and never serves a file for nobody', async () => {
    const { routes, invoke } = build(() =>
      Promise.resolve(JSON.stringify({ serve: { kind: 'albumArtwork', albumId: 'a1' } })),
    );

    await expect(routes.answer('music', 'feed', asking())).resolves.toEqual({ kind: 'failed' });
    expect(invoke.mock.calls[0]?.[2]).toEqual({ kind: 'nobody' });
    expect(invoke.mock.calls[0]?.[1]).toMatchObject({ person: null });
  });

  it('hands a serve back for the person to be served as', async () => {
    const { routes } = build(() =>
      Promise.resolve(JSON.stringify({ serve: { kind: 'track', mediaId: 'm1', quality: 'high' } })),
    );
    const { secret } = await madeFor(routes);

    await expect(
      routes.answer('music', 'rest', asking({ query: { u: ['sam-smith'], p: [secret] } })),
    ).resolves.toEqual({
      kind: 'serve',
      serve: { kind: 'track', mediaId: 'm1', quality: 'high' },
      viewer: SAMS_VIEW,
    });
  });

  it('says it failed where the plugin answers with a page or throws', async () => {
    const page = build(() =>
      Promise.resolve(JSON.stringify({ status: 200, contentType: 'text/html', body: '<p>' })),
    );

    await expect(page.routes.answer('music', 'feed', asking())).resolves.toEqual({
      kind: 'failed',
    });

    const thrown = build(() => Promise.reject(new Error('broken')));

    await expect(thrown.routes.answer('music', 'feed', asking())).resolves.toEqual({
      kind: 'failed',
    });
  });

  it('knows no plugin, route or method it was not given', async () => {
    const { routes } = build();

    await expect(routes.answer('other', 'rest', asking())).resolves.toEqual({ kind: 'unknown' });
    await expect(routes.answer('music', 'nope', asking())).resolves.toEqual({ kind: 'unknown' });
    await expect(routes.answer('music', 'feed', asking({ method: 'POST' }))).resolves.toEqual({
      kind: 'wrongMethod',
      allowed: ['GET'],
    });
    await expect(routes.answer('music', 'feed', asking({ method: 'OPTIONS' }))).resolves.toEqual({
      kind: 'wrongMethod',
      allowed: ['GET'],
    });
  });

  it('limits how often anybody may call a public route', async () => {
    const { routes } = build();

    for (let tries = 0; tries < 120; tries += 1) {
      await routes.answer('music', 'feed', asking());
    }

    await expect(routes.answer('music', 'feed', asking())).resolves.toEqual({
      kind: 'limited',
      retryAfterSeconds: 60,
    });
  });

  it('gives each new password its own login, keeps its secret only sealed and hashed, and lists it', async () => {
    const { routes, store } = build();
    const first = await madeFor(routes);
    const second = await madeFor(routes);

    expect(second.credential.login).toBe('sam-smith-2');
    expect(first.secret).toMatch(/^[A-Za-z0-9_-]{24}$/u);

    const kept = await store.credentialByLogin('music', 'sam-smith');

    expect(kept?.sealedSecret).toBe(`sealed:${first.secret}`);
    expect(kept?.secretHash).not.toContain(first.secret);
    await expect(routes.credentialsOf('music', 'sam')).resolves.toMatchObject({
      routes: [{ id: 'rest', title: 'Music apps' }],
      credentials: [{ login: 'sam-smith' }, { login: 'sam-smith-2' }],
    });
    await expect(routes.credentialsOf('other', 'sam')).resolves.toBeNull();
  });

  it('removes a password only for the person who made it', async () => {
    const { routes } = build();
    const { credential } = await madeFor(routes);

    await expect(routes.forgetCredential('music', 'alex', credential.id)).resolves.toBe(false);
    await expect(routes.forgetCredential('music', 'sam', credential.id)).resolves.toBe(true);
  });

  it('makes no more than twenty passwords for one person, and none for a plugin that takes none', async () => {
    const { routes } = build();

    for (let made = 0; made < 20; made += 1) {
      await madeFor(routes);
    }

    await expect(
      routes.makeCredential('music', { id: 'sam', name: 'Sam' }, 'One more'),
    ).resolves.toBe('tooMany');
    await expect(routes.makeCredential('other', { id: 'sam', name: 'Sam' }, 'Phone')).resolves.toBe(
      'unknown',
    );
  });
});
