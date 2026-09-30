import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { packPlugin } from '@ValenceSDK/package/packPlugin';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import { createPluginService } from './createPluginService';
import type { CatalogueClient } from '@ValenceServer/plugins/catalogue/createCatalogueClient';
import { aPluginHostForTest } from '@ValenceServer/plugins/broker/aPluginHostForTest';
import type { PluginViewer } from './PluginViewer';
import type { PluginChange } from '@ValenceContracts/schemas/Plugin';

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
};

const HOME = { kind: 'page', id: 'home', subject: null } as const;

const build = (
  announce: (change: PluginChange) => void = vi.fn(),
  extra: Partial<Pick<Parameters<typeof createPluginService>[0], 'store' | 'fetchFor'>> = {},
) => {
  const catalogue: CatalogueClient = {
    read: () => Promise.resolve({ catalogue: null, problem: sayVerbatim('offline') }),
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
      problem: 'An administrator has not given Counter its AniList client id yet.',
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
      refused: 'No earlier version of this plugin is kept to go back to.',
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
      /Counter 3\.0\.0 could not bring its data up to date, so 1\.0\.0 was put back as it was\..*The old list could not be read\./u,
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
