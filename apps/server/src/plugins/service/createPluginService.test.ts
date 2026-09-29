import { describe, expect, it, vi } from 'vitest';
import { packPlugin } from '@ValenceSDK/package/packPlugin';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
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
    ],
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
    throw new Error(preview.problem);
  }

  return service.install(
    { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: true },
    'account-1',
  );
};

const VIEWER: PluginViewer = { accountId: 'account-1', profileId: 'profile-1', isAdmin: false };

const HOME = { kind: 'page', id: 'home', subject: null } as const;

const build = (announce: (change: PluginChange) => void = vi.fn()) => {
  const catalogue: CatalogueClient = {
    read: () => Promise.resolve({ catalogue: null, problem: 'offline' }),
    fetchPackage: () => Promise.resolve({ problem: 'offline' }),
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
  });

  return service;
};

const installed = async (announce: (change: PluginChange) => void = vi.fn()) => {
  const service = build(announce);
  const preview = await service.previewUpload(PACKAGE, null, 'account-1');

  if ('problem' in preview) {
    throw new Error(preview.problem);
  }

  const done = await service.install(
    { token: preview.token, permissionsHash: preview.permissionsHash, acceptUnsigned: true },
    'account-1',
  );

  if ('refused' in done) {
    throw new Error(done.refused);
  }

  return service;
};

describe('a plugin from upload to use, through its own process', () => {
  it('marks an upload unsigned, and installs only what was shown and accepted', async () => {
    const service = build();
    const preview = await service.previewUpload(PACKAGE, null, 'account-1');

    if ('problem' in preview) {
      throw new Error(preview.problem);
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
      throw new Error(started.problem);
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

    expect((await service.contributions(false)).pages.map((page) => page.pageId)).toEqual([
      'home',
      'bad',
    ]);
    expect(await service.uninstall('counter')).toBe(true);
    expect(await service.render('counter', HOME, VIEWER)).toBeNull();
    expect(await service.listInstalled()).toEqual([]);
  });

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

    expect('refused' in upgraded ? upgraded.refused : upgraded.previousVersion).toBe('1.0.0');
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

    expect('refused' in upgraded ? upgraded.refused : '').toMatch(
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
});
