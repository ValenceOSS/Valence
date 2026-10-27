import sharp from 'sharp';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { packPlugin } from '@ValenceSDK/package/packPlugin';
import { signBytes } from '@ValenceSDK/package/signBytes';
import { aKeyPair } from '@ValenceSDK/testing/aKeyPair';
import { EXAMPLE_FILES_MANIFEST } from '@ValenceSDK/testing/EXAMPLE_FILES_MANIFEST';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import { createPluginService } from './createPluginService';
import type { CatalogueClient } from '@ValenceServer/plugins/catalogue/createCatalogueClient';
import { aPluginHostForTest } from '@ValenceServer/plugins/broker/aPluginHostForTest';
import type { PluginViewer } from './PluginViewer';
import type { PluginChange } from '@ValenceContracts/schemas/Plugin';
import type { CatalogueEntry } from '@ValenceSDK/package/CatalogueSchema';
import type { PluginStore } from '@ValenceServer/plugins/store/PluginStore';

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'counter',
  name: 'Counter',
  version: '1.0.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Counts presses.',
  entry: 'dist/plugin.js',
  permissions: [
    { kind: 'storage', quotaBytes: 4096 },
    { kind: 'network', hosts: ['anilist.co'] },
    {
      kind: 'accounts',
      providers: [
        {
          id: 'anilist',
          name: 'AniList',
          authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
          tokenUrl: 'https://anilist.co/api/v2/oauth/token',
          revokeUrl: 'https://anilist.co/api/v2/oauth/revoke',
          scopes: [],
          clientIdSetting: 'clientId',
        },
      ],
    },
  ],
  settings: [{ id: 'clientId', label: 'Client id', kind: 'text' }],
  contributes: {
    pages: [
      { id: 'home', title: 'Counter', placement: 'account' },
      { id: 'bad', title: 'Bad', placement: 'account' },
      { id: 'secret', title: 'Secret', placement: 'admin' },
      { id: 'managed', title: 'Managed', placement: 'account', requires: 'manage' },
    ],
    nodes: [{ id: 'manage', title: 'Manage the counter' }],
  },
});

const CODE = `globalThis.valencePlugin = {
  pages: {
    home: {
      render: async ({ valence }) => {
        const count = (await valence.storage.get('count')) ?? 0;
        return { blocks: [{ type: 'text', text: 'Pressed ' + count }] };
      },
      act: async ({ valence }, request) => {
        if (request.action.id === 'press') {
          await valence.storage.set('count', ((await valence.storage.get('count')) ?? 0) + 1);
        }
        return null;
      },
    },
    bad: { render: async () => ({ blocks: [{ type: 'script', source: 'alert(1)' }] }) },
    secret: { render: async () => ({ blocks: [{ type: 'text', text: 'admins only' }] }) },
    managed: {
      render: async ({ viewer }) => ({ blocks: [{ type: 'text', text: 'holds ' + viewer.nodes.join(',') }] }),
    },
  },
};`;

const PACKAGE = packPlugin({ format: 1, manifest: MANIFEST, code: CODE, assets: {} });

/**
 * The counter plugin at another version, with a data change of its own to run when it is upgraded
 * to.
 *
 * @param version - The version.
 * @param onUpgraded - The body of its onUpgraded hook.
 * @returns The package.
 */
const counterAt = (version: string, onUpgraded: string): Uint8Array =>
  packPlugin({
    format: 1,
    manifest: { ...MANIFEST, version },
    code: CODE.replace(
      'globalThis.valencePlugin = {',
      `globalThis.valencePlugin = {\n  onUpgraded: async ({ valence }, versions) => { ${onUpgraded} },`,
    ),
    assets: {},
  });

/**
 * Installs a package over whatever the service already has, accepting it as shown.
 *
 * @param service - The service.
 * @param bytes - The package.
 * @returns What installing said.
 */
const installOver = async (service: ReturnType<typeof build>, bytes: Uint8Array) => {
  const preview = await service.previewUpload(bytes, null, 'account-1');

  if ('problem' in preview) {
    throw new Error(preview.problem.message);
  }

  return service.install(
    { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: true },
    'account-1',
  );
};

const VIEWER: PluginViewer = {
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdmin: false,
  grants: new Set(),
  reads: {
    kind: 'account',
    accountId: 'account-1',
    profileId: 'profile-1',
    isAdministrator: false,
  },
};

const HOME = { kind: 'page', id: 'home', subject: null } as const;

const build = (
  announce: (change: PluginChange) => void = vi.fn(),
  extra: Partial<
    Pick<
      Parameters<typeof createPluginService>[0],
      | 'store'
      | 'fetchFor'
      | 'host'
      | 'catalogue'
      | 'keys'
      | 'trustedKeys'
      | 'now'
      | 'onConnectionLapsed'
      | 'apiVersion'
    >
  > = {},
) => {
  const catalogue: CatalogueClient = {
    read: () =>
      Promise.resolve({ catalogue: null, problem: sayVerbatim('offline'), signedBy: null }),
    fetchPackage: () => Promise.resolve({ problem: sayVerbatim('offline') }),
  };
  const service = createPluginService({
    store: createMemoryPluginStore(),
    host: aPluginHostForTest(),
    catalogue,
    keys: {},
    sealingKey: Buffer.alloc(32, 7),
    redirectUri: 'https://valence.home/api/plugins/oauth/callback',
    apiVersion: '1.0.0',
    enqueueSchedule: vi.fn(() => Promise.resolve()),
    log: vi.fn(),
    announce,
    ...extra,
  });

  return service;
};

const installed = async (
  announce: (change: PluginChange) => void = vi.fn(),
  extra: Parameters<typeof build>[1] = {},
) => {
  const service = build(announce, extra);
  const preview = await service.previewUpload(PACKAGE, null, 'account-1');

  if ('problem' in preview) {
    throw new Error(preview.problem.message);
  }

  const done = await service.install(
    { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: true },
    'account-1',
  );

  if ('refused' in done) {
    throw new Error(done.refused.message);
  }

  return service;
};

describe('a plugin from upload to use, through its own process', () => {
  it('marks an upload unsigned, and installs only what was shown and accepted', async () => {
    const service = build();
    const preview = await service.previewUpload(PACKAGE, null, 'account-1');

    if ('problem' in preview) {
      throw new Error(preview.problem.message);
    }

    expect(preview.trust).toBe('unsigned');
    expect(preview.warnings).toEqual([]);
    expect(
      await service.install(
        { token: preview.token, permissionsHash: 'something-else', acceptUnsigned: true },
        'account-1',
      ),
    ).toHaveProperty('refused');
    expect(
      await service.install(
        { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: false },
        'account-1',
      ),
    ).toHaveProperty('refused');
    expect(
      await service.install(
        { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: true },
        'somebody-else',
      ),
    ).toHaveProperty('refused');
    expect(
      await service.install(
        { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: true },
        'account-1',
      ),
    ).toMatchObject({ id: 'counter', trust: 'unsigned' });
    expect(await service.listInstalled()).toHaveLength(1);
  });

  it('refuses a package that is not a plugin', async () => {
    expect(
      await build().previewUpload(new Uint8Array([1, 2, 3]), null, 'account-1'),
    ).toHaveProperty('problem');
  });

  it('draws a page, acts on it, and draws it again as it now is', async () => {
    const service = await installed();

    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'Pressed 0' }],
    });
    expect(
      await service.act('counter', HOME, VIEWER, { action: { id: 'press' }, fields: {} }),
    ).toEqual({ surface: { blocks: [{ type: 'text', text: 'Pressed 1' }] }, navigate: null });

    service.stop();
  }, 30_000);

  it('refuses to draw what is not a Valence surface, and keeps admin pages from others', async () => {
    const service = await installed();
    const bad = await service.render('counter', { kind: 'page', id: 'bad', subject: null }, VIEWER);

    expect(JSON.stringify(bad?.surface)).not.toContain('alert');
    expect(
      await service.render('counter', { kind: 'page', id: 'secret', subject: null }, VIEWER),
    ).toBeNull();
    expect(
      (
        await service.render(
          'counter',
          { kind: 'page', id: 'secret', subject: null },
          { ...VIEWER, isAdmin: true },
        )
      )?.surface,
    ).toEqual({ blocks: [{ type: 'text', text: 'admins only' }] });

    service.stop();
  }, 30_000);

  it('answers connect with a one-use ticket that starts the connection without a session', async () => {
    const service = await installed();
    const connect = {
      action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
      fields: {},
    };
    const first = await service.act('counter', HOME, VIEWER, connect);

    expect(first?.navigate).toMatch(
      /^\/api\/plugins\/counter\/accounts\/anilist\/connect\?ticket=[\w-]+$/,
    );

    const ticket = new URL(first?.navigate ?? '', 'https://valence.home').searchParams.get(
      'ticket',
    );
    const before = await service.connect('counter', 'anilist', {
      ticket,
      viewer: null,
      returnTo: '/',
    });

    expect(before).toEqual({
      problem: 'An administrator hasn’t set the AniList client ID for Counter yet.',
    });

    await service.change('counter', { settings: { clientId: 'client-1' } });

    const second = await service.act('counter', HOME, VIEWER, connect);
    const secondTicket = new URL(second?.navigate ?? '', 'https://valence.home').searchParams.get(
      'ticket',
    );
    const started = await service.connect('counter', 'anilist', {
      ticket: secondTicket,
      viewer: null,
      returnTo: '/',
    });

    if ('problem' in started) {
      throw new Error(started.problem.message);
    }

    const address = new URL(started.location);

    expect(address.origin + address.pathname).toBe('https://anilist.co/api/v2/oauth/authorize');
    expect(address.searchParams.get('client_id')).toBe('client-1');
    expect(address.searchParams.get('code_challenge_method')).toBe('S256');
    expect(started.browser.length).toBeGreaterThan(20);
    expect(
      await service.connect('counter', 'anilist', {
        ticket: secondTicket,
        viewer: null,
        returnTo: '/',
      }),
    ).toHaveProperty('problem');
    expect(
      await service.finishConnection({
        state: address.searchParams.get('state') ?? '',
        code: 'code',
        browser: 'another-browser',
      }),
    ).toMatchObject({ ok: false, returnTo: null });

    service.stop();
  }, 30_000);

  it('never sends the reserved actions to the plugin', async () => {
    const service = await installed();
    const answer = await service.act('counter', HOME, VIEWER, {
      action: { id: 'valence.accounts.disconnect', payload: { provider: 'anilist' } },
      fields: {},
    });

    expect(answer).toEqual({
      surface: { blocks: [{ type: 'text', text: 'Pressed 0' }] },
      navigate: null,
    });

    service.stop();
  }, 30_000);

  it('lists what it adds, and forgets everything when uninstalled', async () => {
    const service = await installed();

    expect(
      (await service.contributions({ isAdmin: false, grants: new Set() })).pages.map(
        (page) => page.pageId,
      ),
    ).toEqual(['home', 'bad']);
    expect(await service.uninstall('counter')).toBe(true);
    expect(await service.render('counter', HOME, VIEWER)).toBeNull();
    expect(await service.listInstalled()).toEqual([]);
  });

  it('refuses an unsigned package over an official plugin of the same id', async () => {
    const store = createMemoryPluginStore();
    const service = await installed(vi.fn(), { store });
    const kept = await store.read('counter');

    if (kept === null) {
      throw new Error('counter was not installed');
    }

    await store.save({ ...kept, trust: 'official' });

    expect(await service.previewUpload(counterAt('1.0.1', ''), null, 'account-1')).toMatchObject({
      problem: { code: 'server.service.pluginService.anUnsignedPackageCannotReplaceOfficial' },
    });
  });

  it('draws a panel only about what the viewer may see, and does not sign them up for it', async () => {
    const store = createMemoryPluginStore();
    const host = aPluginHostForTest();
    const service = build(vi.fn(), { store, host });
    const panelled = PluginManifestSchema.parse({
      ...MANIFEST,
      id: 'panelled',
      permissions: [],
      settings: [],
      contributes: {
        panels: [{ id: 'about', title: 'About', on: 'title' }],
        pages: [{ id: 'home', title: 'Home', placement: 'account' }],
      },
    });

    await installOver(
      service,
      packPlugin({
        format: 1,
        manifest: panelled,
        code: `globalThis.valencePlugin = {
          panels: { about: { render: async () => ({ blocks: [{ type: 'text', text: 'hi' }] }) } },
          pages: { home: { render: async () => ({ blocks: [{ type: 'text', text: 'home' }] }) } },
        };`,
        assets: {},
      }),
    );

    const about = { kind: 'panel', id: 'about', subject: { kind: 'title', id: 'm1' } } as const;

    expect(await service.render('panelled', about, VIEWER)).not.toBeNull();
    expect(await store.profilesOf('panelled')).toEqual([]);

    expect(
      await service.render('panelled', { ...about, subject: { kind: 'album', id: 'a1' } }, VIEWER),
    ).toBeNull();

    vi.mocked(host.library.sees).mockResolvedValueOnce(false);

    expect(await service.render('panelled', about, VIEWER)).toBeNull();

    await service.render('panelled', HOME, VIEWER);

    expect(await store.profilesOf('panelled')).toEqual(['profile-1']);

    service.stop();
  }, 60_000);

  it('fetches only the pictures a plugin drew for this viewer, narrowed to WebP when asked', async () => {
    const wide = await sharp({
      create: { width: 1200, height: 10, channels: 3, background: '#336699' },
    })
      .png()
      .toBuffer();
    const fetchBytes = vi.fn(() =>
      Promise.resolve({ status: 200, headers: { 'content-type': 'image/png' }, body: wide }),
    );
    const service = build(vi.fn(), { fetchFor: () => ({ fetch: vi.fn(), fetchBytes }) });
    const gallery = PluginManifestSchema.parse({
      ...MANIFEST,
      id: 'gallery',
      permissions: [{ kind: 'network', hosts: ['anilist.co'] }],
      settings: [],
      contributes: { pages: [{ id: 'home', title: 'Gallery', placement: 'account' }] },
    });

    await installOver(
      service,
      packPlugin({
        format: 1,
        manifest: gallery,
        code: `globalThis.valencePlugin = { pages: { home: { render: async () => ({ blocks: [
          { type: 'image', alt: 'A', image: { kind: 'remote', url: 'https://anilist.co/a.png' } },
          { type: 'image', alt: 'B', image: { kind: 'remote', url: 'https://anilist.co/b.gif' } },
        ] }) } } };`,
        assets: {},
      }),
    );

    expect(await service.image('gallery', 'https://anilist.co/a.png', VIEWER)).toBeNull();

    await service.render('gallery', HOME, VIEWER);

    expect(await service.image('gallery', 'https://anilist.co/a.png', VIEWER)).toEqual({
      body: wide,
      contentType: 'image/png',
    });
    expect(
      await service.image('gallery', 'https://anilist.co/a.png', { profileId: 'someone-else' }),
    ).toBeNull();
    expect(await service.image('gallery', 'https://anilist.co/elsewhere.png', VIEWER)).toBeNull();

    const narrowed = await service.image('gallery', 'https://anilist.co/a.png', VIEWER, 342);

    expect(narrowed !== null && narrowed !== 'tooOften' ? narrowed.contentType : null).toBe(
      'image/webp',
    );

    fetchBytes.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': 'image/gif' },
      body: wide,
    });

    const moving = await service.image('gallery', 'https://anilist.co/b.gif', VIEWER, 342);

    expect(moving !== null && moving !== 'tooOften' ? moving.contentType : null).toBe('image/gif');

    service.stop();
  }, 60_000);

  it('says what removing it takes, and asks the provider to cancel each connected account', async () => {
    const store = createMemoryPluginStore();
    const fetch = vi.fn(() => Promise.resolve({ status: 200, headers: {}, text: '' }));
    const service = await installed(vi.fn(), {
      store,
      fetchFor: () => ({ fetch, fetchBytes: vi.fn() }),
    });

    await service.change('counter', { settings: { clientId: 'client-1' } });
    await store.writeValue('counter', 'count', 3, 1);
    await store.saveConnection({
      pluginId: 'counter',
      profileId: 'p1',
      provider: 'anilist',
      accessToken: sealSecret(Buffer.alloc(32, 7), 'at1'),
      refreshToken: null,
      expiresAt: null,
      account: null,
    });

    expect(await service.removal('counter')).toEqual({
      bytesKept: 1,
      people: 1,
      accounts: [{ provider: 'AniList', connected: 1, isRevoked: true }],
      themes: 0,
      nodes: 1,
      webhooks: 0,
      keepsEarlierVersion: false,
    });
    expect(await service.uninstall('counter')).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://anilist.co/api/v2/oauth/revoke',
      expect.objectContaining({
        method: 'POST',
        body: 'token=at1&token_type_hint=access_token&client_id=client-1',
      }),
    );
    expect(await store.connectionsOf('counter')).toEqual([]);
    expect(await service.removal('counter')).toBeNull();

    service.stop();
  }, 30_000);

  it('tells whoever a connection lapsed for, pointing at the plugin’s page, and the plugin finds it gone', async () => {
    const store = createMemoryPluginStore();
    const onConnectionLapsed = vi.fn(() => Promise.resolve());
    const service = build(vi.fn(), { store, onConnectionLapsed });
    const done = await installOver(
      service,
      packPlugin({
        format: 1,
        manifest: MANIFEST,
        code: CODE.replace(
          "const count = (await valence.storage.get('count')) ?? 0;",
          "const count = (await valence.accounts.connection(viewer.profileId, 'anilist')) === null ? 'never' : 'once';",
        ).replace('render: async ({ valence }) => {', 'render: async ({ valence, viewer }) => {'),
        assets: {},
      }),
    );

    expect('refused' in done).toBe(false);

    await service.change('counter', { settings: { clientId: 'client-1' } });
    await store.saveConnection({
      pluginId: 'counter',
      profileId: VIEWER.profileId,
      provider: 'anilist',
      accessToken: sealSecret(Buffer.alloc(32, 7), 'at1'),
      refreshToken: null,
      expiresAt: '2000-01-01T00:00:00.000Z',
      account: null,
    });

    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'Pressed never' }],
    });
    await vi.waitFor(() => {
      expect(onConnectionLapsed).toHaveBeenCalled();
    });
    expect(onConnectionLapsed).toHaveBeenCalledExactlyOnceWith({
      profileId: VIEWER.profileId,
      plugin: 'Counter',
      provider: 'AniList',
      link: '/?account=plugin.counter.home',
    });
    expect(await store.readConnection('counter', VIEWER.profileId, 'anilist')).toBeNull();

    service.stop();
  }, 30_000);

  it('tells every client when a plugin arrives, is turned off or on, changes, or goes', async () => {
    const announce = vi.fn<(change: PluginChange) => void>();
    const service = await installed(announce);

    await service.change('counter', { isEnabled: false });
    await service.change('counter', { isEnabled: false });
    await service.change('counter', { isEnabled: true });
    await service.uninstall('counter');

    expect(announce.mock.calls.map(([said]) => said.change)).toEqual([
      'installed',
      'disabled',
      'settings',
      'enabled',
      'removed',
    ]);
    expect(announce.mock.calls.every(([said]) => said.pluginId === 'counter')).toBe(true);
  });

  it('runs an upgrade’s own data change, and rolls back to the version and data it replaced', async () => {
    const service = await installed();
    const press = { action: { id: 'press' }, fields: {} };

    await service.act('counter', HOME, VIEWER, press);
    await service.act('counter', HOME, VIEWER, press);

    const upgraded = await installOver(
      service,
      counterAt(
        '2.0.0',
        "await valence.storage.set('count', ((await valence.storage.get('count')) ?? 0) * 10);",
      ),
    );

    expect('refused' in upgraded ? upgraded.refused : upgraded.previousVersion).toEqual('1.0.0');
    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'Pressed 20' }],
    });

    const rolled = await service.rollback('counter');

    expect(rolled !== null && !('refused' in rolled) ? rolled.version : rolled).toBe('1.0.0');
    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'Pressed 2' }],
    });
    expect(await service.rollback('counter')).toEqual({
      refused: 'There’s no earlier version of this plugin to roll back to.',
    });

    service.stop();
  }, 30_000);

  it('puts the earlier version and its data back when an upgrade’s data change fails', async () => {
    const service = await installed();

    await service.act('counter', HOME, VIEWER, { action: { id: 'press' }, fields: {} });

    const upgraded = await installOver(
      service,
      counterAt(
        '3.0.0',
        "await valence.storage.set('count', 999); throw new Error('The old list could not be read.');",
      ),
    );

    expect('refused' in upgraded ? upgraded.refused.message : '').toMatch(
      /Counter 3\.0\.0 couldn’t migrate its data, so it was rolled back to 1\.0\.0\..*The old list could not be read\./u,
    );

    const [kept] = await service.listInstalled();

    expect(kept?.version).toBe('1.0.0');
    expect(kept?.previousVersion).toBeNull();
    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'Pressed 1' }],
    });

    service.stop();
  }, 30_000);

  it('shows a page that needs a permission node only to whoever holds it, and says which they hold', async () => {
    const service = await installed();
    const managed = { kind: 'page', id: 'managed', subject: null } as const;
    const holder: PluginViewer = { ...VIEWER, grants: new Set(['plugin.counter.manage']) };

    expect(await service.render('counter', managed, VIEWER)).toBeNull();
    expect((await service.contributions(VIEWER)).pages.map((page) => page.pageId)).not.toContain(
      'managed',
    );
    expect((await service.render('counter', managed, holder))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'holds manage' }],
    });
    expect((await service.contributions(holder)).pages.map((page) => page.pageId)).toContain(
      'managed',
    );
    expect((await service.contributions(VIEWER)).nodes).toEqual([
      {
        node: 'plugin.counter.manage',
        pluginId: 'counter',
        pluginName: 'Counter',
        title: 'Manage the counter',
        description: null,
      },
    ]);

    service.stop();
  }, 30_000);

  it('hands a webhook to the plugin at its own private address, and nowhere else', async () => {
    const service = build();
    const hooked = packPlugin({
      format: 1,
      manifest: PluginManifestSchema.parse({
        ...MANIFEST,
        id: 'hooked',
        name: 'Hooked',
        permissions: [{ kind: 'storage', quotaBytes: 4096 }, { kind: 'webhooks' }],
        contributes: {
          pages: [{ id: 'last', title: 'Last message', placement: 'account' }],
          webhooks: [{ id: 'spotify', title: 'Spotify changes' }],
        },
        settings: [],
      }),
      code: `globalThis.valencePlugin = {
  pages: {
    last: {
      render: async ({ valence }) => ({
        blocks: [{ type: 'text', text: JSON.stringify(await valence.storage.get('last')) }],
      }),
    },
  },
  webhooks: {
    spotify: async ({ valence }, request) => {
      const signed = await valence.crypto.hmac('sha256', 'shared', request.body);
      const good = await valence.crypto.equal(signed, request.headers['x-signature'] ?? '');
      await valence.storage.set('last', { body: request.body, good });
    },
  },
};`,
      assets: {},
    });
    const done = await installOver(service, hooked);

    expect('refused' in done ? done.refused : done.webhooks.map((hook) => hook.id)).toEqual([
      'spotify',
    ]);

    const [listed] = await service.listInstalled();
    const address = new URL(listed?.webhooks[0]?.url ?? '');
    const secret = address.pathname.split('/').at(-1) ?? '';

    expect(address.origin).toBe('https://valence.home');
    expect(address.pathname).toMatch(/^\/api\/plugins\/hooked\/hooks\/spotify\/[\w-]{32}$/u);

    const forged = `${secret.slice(0, -1)}${secret.endsWith('x') ? 'y' : 'x'}`;
    const signature = createHmac('sha256', 'shared').update('{"changed":true}').digest('hex');

    expect(
      await service.receiveWebhook('hooked', 'spotify', secret, {
        headers: { 'x-signature': signature },
        body: '{"changed":true}',
      }),
    ).toBe('accepted');
    expect(
      await service.receiveWebhook('hooked', 'spotify', forged, {
        headers: {},
        body: 'forged',
      }),
    ).toBe('unknown');
    expect(
      await service.receiveWebhook('hooked', 'elsewhere', secret, { headers: {}, body: '' }),
    ).toBe('unknown');

    const last = { kind: 'page', id: 'last', subject: null } as const;

    expect((await service.render('hooked', last, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: '{"body":"{\\"changed\\":true}","good":true}' }],
    });

    service.stop();
  }, 30_000);

  it('turns webhooks away once a plugin has had too many in a minute', async () => {
    const service = build();
    const hooked = packPlugin({
      format: 1,
      manifest: PluginManifestSchema.parse({
        ...MANIFEST,
        id: 'busy',
        name: 'Busy',
        permissions: [{ kind: 'webhooks' }],
        contributes: { webhooks: [{ id: 'ping', title: 'Pings' }] },
        settings: [],
      }),
      code: 'globalThis.valencePlugin = { webhooks: { ping: async () => {} } };',
      assets: {},
    });

    await installOver(service, hooked);

    const [listed] = await service.listInstalled();
    const secret = new URL(listed?.webhooks[0]?.url ?? '').pathname.split('/').at(-1) ?? '';
    const answers = [];

    for (let sent = 0; sent < 61; sent += 1) {
      answers.push(await service.receiveWebhook('busy', 'ping', secret, { headers: {}, body: '' }));
    }

    expect(answers.filter((answer) => answer === 'accepted')).toHaveLength(60);
    expect(answers.at(-1)).toBe('limited');

    service.stop();
  }, 60_000);
});

describe('telling plugins what happened', () => {
  const TRACKER = PluginManifestSchema.parse({
    manifestVersion: 2,
    id: 'tracker',
    name: 'Tracker',
    version: '1.0.0',
    apiVersion: '^1.0',
    author: { name: 'Tester' },
    description: 'Hears what was watched.',
    entry: 'dist/plugin.js',
    permissions: [
      { kind: 'storage', quotaBytes: 4096 },
      { kind: 'viewing', access: 'read' },
    ],
    contributes: { events: ['playback.stopped', 'playback.finished'] },
  });

  const HEARS = `globalThis.valencePlugin = {
  events: async (event, { valence }) => {
    const heard = (await valence.storage.get('heard')) ?? [];
    await valence.storage.set('heard', [...heard, event.topic]);
  },
};`;

  it('tells a plugin that keeps things which profiles were removed', async () => {
    const store = createMemoryPluginStore();
    const service = build(vi.fn(), { store });

    await installOver(
      service,
      packPlugin({
        format: 1,
        manifest: {
          ...TRACKER,
          contributes: { ...TRACKER.contributes, events: ['profile.removed'] },
        },
        code: HEARS.replace('event.topic]', "event.topic + ' ' + event.profileId]"),
        assets: {},
      }),
    );

    service.profilesRemoved(['profile-1', 'profile-2']);

    await vi.waitFor(
      async () => {
        expect(await store.readValue('tracker', 'heard')).toEqual([
          'profile.removed profile-1',
          'profile.removed profile-2',
        ]);
      },
      { timeout: 20_000 },
    );

    service.stop();
  }, 60_000);

  it('tells a plugin something finished when it stopped in the credits, only for its own users', async () => {
    const store = createMemoryPluginStore();
    const service = createPluginService({
      store,
      host: aPluginHostForTest(),
      catalogue: {
        read: () =>
          Promise.resolve({ catalogue: null, problem: sayVerbatim('offline'), signedBy: null }),
        fetchPackage: () => Promise.resolve({ problem: sayVerbatim('offline') }),
      },
      keys: {},
      sealingKey: Buffer.alloc(32, 7),
      redirectUri: 'https://valence.home/api/plugins/oauth/callback',
      apiVersion: '1.0.0',
      enqueueSchedule: vi.fn(() => Promise.resolve()),
      log: vi.fn(),
      segmentsOf: () =>
        Promise.resolve([
          { kind: 'credits', startSeconds: 840, endSeconds: 1000, source: 'manual' },
        ]),
    });

    await installOver(
      service,
      packPlugin({ format: 1, manifest: TRACKER, code: HEARS, assets: {} }),
    );

    const stoppedBy = (profileId: string) =>
      service.dispatch({
        event: 'playback.stopped',
        data: {
          accountId: 'account-1',
          accountName: 'Ada',
          profileId,
          profileName: 'Ada',
          item: {
            itemId: 'item-1',
            kind: 'movie',
            title: 'Film',
            seriesTitle: null,
            seasonNumber: null,
            episodeNumber: null,
            year: 2016,
            posterUrl: null,
            libraryId: 'library-1',
            libraryName: 'Films',
            overview: null,
            durationSeconds: 1000,
            genres: [],
            rating: null,
            quality: null,
          },
          deviceLabel: 'Chrome on macOS',
          mode: 'DirectPlay',
          positionSeconds: 850,
          durationSeconds: 1000,
        },
      });

    await store.rememberProfile('tracker', 'profile-1');
    stoppedBy('profile-2');
    stoppedBy('profile-1');

    await vi.waitFor(
      async () => {
        expect(await store.readValue('tracker', 'heard')).toEqual([
          'playback.stopped',
          'playback.finished',
        ]);
      },
      { timeout: 20_000 },
    );

    service.stop();
  }, 60_000);
});

const OURS = aKeyPair();

const THEIRS = aKeyPair();

/**
 * A signature file naming the key that made it.
 *
 * @param bytes - What was signed.
 * @param keyId - The key's id.
 * @param privateKey - The key.
 * @returns The signature file's text.
 */
const signatureOf = (bytes: Uint8Array, keyId: string, privateKey: string): string =>
  JSON.stringify({ keyId, signature: signBytes(bytes, privateKey) });

/**
 * Trusted keys as the operator would have set them.
 *
 * @param keys - The keys, by id.
 * @returns What the service asks of them.
 */
const theirKeys = (keys: Record<string, string>) => ({
  all: () => Promise.resolve(keys),
  list: () => Promise.resolve([]),
  save: () => Promise.resolve({ keys: [] }),
});

/**
 * A catalogue listing the counter plugin, newest first, with the versions given.
 *
 * @param versions - Each version and the plugin API it needs.
 * @returns The catalogue client, which hands back the package for whichever version is asked for.
 */
const catalogueOf = (versions: { version: string; apiVersion: string }[]) => {
  const asListed = versions.map((each) => ({
    ...each,
    permissions: MANIFEST.permissions,
    packageUrl: `https://example.com/counter-${each.version}.vplugin`,
    sha256: 'a'.repeat(64),
    signature: 'AAAA',
    keyId: 'valence-official-2026',
    publishedAt: '2026-10-01T00:00:00.000Z',
  }));
  const [newest, ...earlier] = asListed;

  if (newest === undefined) {
    throw new Error('A catalogue entry needs a version.');
  }

  const entry: CatalogueEntry = {
    ...newest,
    id: 'counter',
    name: 'Counter',
    description: 'Counts presses.',
    author: 'Tester',
    kinds: ['extension'],
    sourceUrl: 'https://example.com/counter',
    earlier,
  };
  const fetched: string[] = [];
  const catalogue: CatalogueClient = {
    read: () =>
      Promise.resolve({
        catalogue: { format: 1, generatedAt: '2026-10-01T00:00:00.000Z', plugins: [entry] },
        problem: null,
        signedBy: 'official',
      }),
    fetchPackage: (asked) => {
      fetched.push(asked.version);

      return Promise.resolve({ bytes: counterAt(asked.version, ''), signedBy: 'official' });
    },
  };

  return { catalogue, fetched };
};

describe('installing and updating', () => {
  it('calls a package signed by a key the operator trusts trusted, never official', async () => {
    const store = createMemoryPluginStore();
    const service = build(vi.fn(), {
      store,
      keys: { 'valence-official-2026': OURS.publicKey },
      trustedKeys: theirKeys({ 'home-lab': THEIRS.publicKey }),
    });
    const bytes = counterAt('1.0.0', '');
    const preview = await service.previewUpload(
      bytes,
      signatureOf(bytes, 'home-lab', THEIRS.privateKey),
      'account-1',
    );

    expect(preview).toMatchObject({ trust: 'trusted', warnings: [] });

    const posing = build(vi.fn(), {
      keys: { 'valence-official-2026': OURS.publicKey },
      trustedKeys: theirKeys({ 'valence-official-2026': THEIRS.publicKey }),
    });

    expect(
      await posing.previewUpload(
        bytes,
        signatureOf(bytes, 'valence-official-2026', THEIRS.privateKey),
        'account-1',
      ),
    ).toMatchObject({ trust: 'unsigned' });
  });

  it('lets only an official package replace an official plugin, and forgets a lesser one it replaces', async () => {
    const store = createMemoryPluginStore();
    const service = build(vi.fn(), {
      store,
      keys: { 'valence-official-2026': OURS.publicKey },
      trustedKeys: theirKeys({ 'home-lab': THEIRS.publicKey }),
    });
    const signedBy = async (version: string, keyId: string, privateKey: string) => {
      const bytes = counterAt(version, '');
      const preview = await service.previewUpload(
        bytes,
        signatureOf(bytes, keyId, privateKey),
        'account-1',
      );

      if ('problem' in preview) {
        return preview;
      }

      return service.install(
        { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: false },
        'account-1',
      );
    };

    expect(await signedBy('1.0.0', 'home-lab', THEIRS.privateKey)).toMatchObject({
      trust: 'trusted',
    });
    expect(await signedBy('1.1.0', 'valence-official-2026', OURS.privateKey)).toMatchObject({
      trust: 'official',
      previousVersion: null,
    });
    expect(await signedBy('1.2.0', 'home-lab', THEIRS.privateKey)).toMatchObject({
      problem: { code: 'server.service.pluginService.anUnsignedPackageCannotReplaceOfficial' },
    });

    service.stop();
  }, 30_000);

  it('offers the newest version this server runs, only when it is newer', async () => {
    const { catalogue, fetched } = catalogueOf([
      { version: '2.0.0', apiVersion: '^2.0' },
      { version: '1.10.0', apiVersion: '^1.0' },
      { version: '1.9.0', apiVersion: '^1.0' },
    ]);
    const service = build(vi.fn(), { catalogue });

    await installOver(service, counterAt('1.9.0', ''));

    expect((await service.listInstalled())[0]?.updateAvailable).toBe('1.10.0');
    expect((await service.readCatalogue()).plugins[0]).toMatchObject({
      version: '1.10.0',
      isCompatible: true,
    });

    const preview = await service.previewFromCatalogue('counter', 'account-1');

    expect(fetched).toEqual(['1.10.0']);
    expect(preview).toMatchObject({ trust: 'official', plugin: { version: '1.10.0' } });

    await installOver(service, counterAt('1.10.0', ''));

    expect((await service.listInstalled())[0]?.updateAvailable).toBeNull();

    await installOver(service, counterAt('1.11.0', ''));

    expect((await service.listInstalled())[0]?.updateAvailable).toBeNull();

    service.stop();
  }, 30_000);

  it('says a manual install of an older version is a downgrade', async () => {
    const service = build();

    await installOver(service, counterAt('2.0.0', ''));

    const preview = await service.previewUpload(counterAt('1.9.0', ''), null, 'account-1');

    expect('problem' in preview ? [] : preview.warnings).toEqual([
      'This is version 1.9.0, older than version 2.0.0, which is installed. What the newer version kept may not convert back.',
    ]);

    service.stop();
  }, 30_000);

  it('holds back other work and draws a notice while an upgrade converts what was kept', async () => {
    const memory = createMemoryPluginStore();
    let open: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    const store: PluginStore = {
      ...memory,
      writeValue: async (pluginId, key, value, bytes) => {
        if (key === 'converted') {
          await gate;
        }

        await memory.writeValue(pluginId, key, value, bytes);
      },
    };
    const service = build(vi.fn(), { store });

    await installOver(service, counterAt('1.0.0', ''));

    const upgrading = installOver(
      service,
      counterAt('2.0.0', "await valence.storage.set('converted', true);"),
    );

    await vi.waitFor(async () => {
      expect((await service.listInstalled())[0]?.state).toBe('upgrading');
    });

    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [
        expect.objectContaining({
          type: 'notice',
          title: 'Counter is being updated.',
        }),
      ],
    });

    let held = true;
    const scheduled = service.runSchedule('counter', 'nothing').then(() => {
      held = false;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(held).toBe(true);

    open();

    expect(await upgrading).toMatchObject({ version: '2.0.0' });

    await scheduled;

    expect(held).toBe(false);
    expect((await service.render('counter', HOME, VIEWER))?.surface).toEqual({
      blocks: [{ type: 'text', text: 'Pressed 0' }],
    });

    service.stop();
  }, 30_000);

  it('keeps settings across an upgrade only where they keep their kind, and puts them back on rollback', async () => {
    const service = build();
    const withRegion = (version: string, kind: 'text' | 'toggle') =>
      packPlugin({
        format: 1,
        manifest: {
          ...MANIFEST,
          version,
          settings: [...MANIFEST.settings, { id: 'region', label: 'Region', kind }],
        },
        code: CODE,
        assets: {},
      });

    await installOver(service, withRegion('1.0.0', 'text'));
    await service.change('counter', { settings: { clientId: 'abc', region: 'eu' } });

    const upgraded = await installOver(service, withRegion('2.0.0', 'toggle'));

    expect('refused' in upgraded ? null : upgraded.settings).toEqual([
      expect.objectContaining({ id: 'clientId', value: 'abc', isSet: true }),
      expect.objectContaining({ id: 'region', value: null, isSet: false }),
    ]);

    const rolled = await service.rollback('counter');

    expect(rolled !== null && !('refused' in rolled) ? rolled.settings : rolled).toEqual([
      expect.objectContaining({ id: 'clientId', value: 'abc' }),
      expect.objectContaining({ id: 'region', value: 'eu' }),
    ]);

    service.stop();
  }, 30_000);

  it('serves a plugin’s own pictures only while it is turned on, its icon always', async () => {
    const service = build();

    await installOver(
      service,
      packPlugin({
        format: 1,
        manifest: { ...MANIFEST, icon: 'icon.png' },
        code: CODE,
        assets: { 'icon.png': 'AAAA', 'banner.png': 'AAAA' },
      }),
    );

    expect(await service.asset('counter', 'banner.png')).toMatchObject({
      contentType: 'image/png',
    });

    await service.change('counter', { isEnabled: false });

    expect(await service.asset('counter', 'banner.png')).toBeNull();
    expect(await service.asset('counter', 'icon.png')).toMatchObject({ contentType: 'image/png' });

    service.stop();
  }, 30_000);

  it('counts only the webhooks it took, so a sender retrying while refused is let in after a minute', async () => {
    let clock = 0;
    const service = build(vi.fn(), { now: () => clock });
    const hooked = packPlugin({
      format: 1,
      manifest: PluginManifestSchema.parse({
        ...MANIFEST,
        id: 'busy',
        name: 'Busy',
        permissions: [{ kind: 'webhooks' }],
        contributes: { webhooks: [{ id: 'ping', title: 'Pings' }] },
        settings: [],
      }),
      code: 'globalThis.valencePlugin = { webhooks: { ping: async () => {} } };',
      assets: {},
    });

    await installOver(service, hooked);

    const [listed] = await service.listInstalled();
    const secret = new URL(listed?.webhooks[0]?.url ?? '').pathname.split('/').at(-1) ?? '';
    const send = () => service.receiveWebhook('busy', 'ping', secret, { headers: {}, body: '' });

    for (let sent = 0; sent < 60; sent += 1) {
      await send();
    }

    clock = 30_000;

    for (let sent = 0; sent < 60; sent += 1) {
      expect(await send()).toBe('limited');
    }

    clock = 61_000;

    expect(await send()).toBe('accepted');

    service.stop();
  }, 60_000);

  it('puts back a trusted version when the official one replacing it cannot convert its data', async () => {
    const service = build(vi.fn(), {
      keys: { 'valence-official-2026': OURS.publicKey },
      trustedKeys: theirKeys({ 'home-lab': THEIRS.publicKey }),
    });
    const signedBy = async (bytes: Uint8Array, keyId: string, privateKey: string) => {
      const preview = await service.previewUpload(
        bytes,
        signatureOf(bytes, keyId, privateKey),
        'account-1',
      );

      if ('problem' in preview) {
        return preview;
      }

      return service.install(
        { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: false },
        'account-1',
      );
    };

    await signedBy(counterAt('1.0.0', ''), 'home-lab', THEIRS.privateKey);

    const failed = await signedBy(
      counterAt('2.0.0', "throw new Error('No.');"),
      'valence-official-2026',
      OURS.privateKey,
    );

    expect('refused' in failed ? failed.refused.message : '').toMatch(/rolled back to 1\.0\.0/u);
    expect((await service.listInstalled())[0]).toMatchObject({
      version: '1.0.0',
      trust: 'trusted',
    });
    expect(
      await signedBy(counterAt('2.0.1', ''), 'valence-official-2026', OURS.privateKey),
    ).toMatchObject({ version: '2.0.1', trust: 'official', previousVersion: null });

    service.stop();
  }, 30_000);

  it('waits for an upgrade to finish before rolling back or installing again', async () => {
    const memory = createMemoryPluginStore();
    let open: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    const store: PluginStore = {
      ...memory,
      writeValue: async (pluginId, key, value, bytes) => {
        if (key === 'converted') {
          await gate;
        }

        await memory.writeValue(pluginId, key, value, bytes);
      },
    };
    const service = build(vi.fn(), { store });

    await installOver(service, counterAt('1.0.0', ''));

    const upgrading = installOver(
      service,
      counterAt('2.0.0', "await valence.storage.set('converted', true);"),
    );

    await vi.waitFor(async () => {
      expect((await service.listInstalled())[0]?.state).toBe('upgrading');
    });

    const order: string[] = [];
    const rolling = service.rollback('counter').then((rolled) => {
      order.push(
        `rolled back to ${rolled !== null && !('refused' in rolled) ? rolled.version : '?'}`,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(order).toEqual([]);

    open();

    expect(await upgrading).toMatchObject({ version: '2.0.0' });

    await rolling;

    expect(order).toEqual(['rolled back to 1.0.0']);

    service.stop();
  }, 30_000);

  it('lists the download clients and sources a plugin offers, and runs them in its process', async () => {
    const service = build(vi.fn(), { apiVersion: '1.4.0' });
    const manifest = PluginManifestSchema.parse(EXAMPLE_FILES_MANIFEST);
    const done = await installOver(
      service,
      packPlugin({
        format: 1,
        manifest,
        code: `globalThis.valencePlugin = {
          downloadClients: {
            files: {
              add: async (context, release) => ({ id: release.title }),
              files: async () => ({ files: [{ name: 'film.mkv', sizeBytes: 3, url: 'https://elsewhere.example.com/f' }] }),
            },
          },
          sources: {
            files: {
              resolve: async () => ({ kind: 'ready', url: 'https://eu1.files.example.test/f', fileName: 'film.mkv', sizeBytes: 3 }),
            },
          },
        };`,
        assets: {},
      }),
    );

    expect('refused' in done).toBe(false);
    expect(await service.contributions(VIEWER)).toMatchObject({
      downloadClients: [
        {
          pluginId: 'example-files',
          pluginName: 'Example files',
          clientId: 'files',
          title: 'Example files',
          protocol: 'torrent',
        },
      ],
      sources: [
        {
          pluginId: 'example-files',
          pluginName: 'Example files',
          sourceId: 'files',
          title: 'Example files',
        },
      ],
    });
    expect(
      await service
        .downloadClient('example-files', 'files')
        .add({ kind: 'nzb', title: 'Film', nzbBase64: 'PG56Yi8+' }),
    ).toEqual({ id: 'Film' });
    await expect(
      service.downloadClient('example-files', 'files').files({ id: 'Film' }),
    ).rejects.toThrow('elsewhere.example.com');
    expect(
      await service.source('example-files', 'files').resolve({
        title: {
          kind: 'film',
          catalogueId: 'c',
          tmdbId: null,
          imdbId: null,
          title: 'A film',
          year: null,
        },
        stream: { key: 'a', name: 'Film', infoHash: null, fileName: null },
      }),
    ).toMatchObject({ kind: 'ready', fileName: 'film.mkv' });

    service.stop();
  }, 30_000);
});
