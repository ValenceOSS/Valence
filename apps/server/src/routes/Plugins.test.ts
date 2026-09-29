import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
import { createPluginService } from '@ValenceServer/plugins/service/createPluginService';
import { aPluginHostForTest } from '@ValenceServer/plugins/broker/aPluginHostForTest';
import { packPlugin } from '@ValenceSDK/package/packPlugin';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import {
  InstalledPluginSchema,
  InstalledPluginsSchema,
  InstallPreviewSchema,
  PluginActAnswerSchema,
  PluginContributionsSchema,
} from '@ValenceContracts/schemas/Plugin';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'route-test',
  name: 'Route Test',
  version: '1.0.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Is reached through the API.',
  entry: 'dist/plugin.js',
  permissions: [
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
    { kind: 'webhooks' },
  ],
  settings: [{ id: 'clientId', label: 'Client id', kind: 'text' }],
  contributes: {
    pages: [{ id: 'home', title: 'Home', placement: 'account' }],
    webhooks: [{ id: 'ping', title: 'Pings' }],
  },
});

const CODE = `globalThis.valencePlugin = {
  pages: { home: { render: async ({ viewer }) => ({ blocks: [{ type: 'text', text: 'Hello ' + viewer.profileId }] }) } },
  webhooks: { ping: async () => {} },
};`;

const PACKAGE = packPlugin({ format: 1, manifest: MANIFEST, code: CODE, assets: {} });

const PreviewAnswer = InstallPreviewSchema;

const signedInWith = async (granted: readonly Permission[]) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const service = createPluginService({
    store: createMemoryPluginStore(),
    host: aPluginHostForTest(),
    catalogue: {
      read: () => Promise.resolve({ catalogue: null, problem: 'offline' }),
      fetchPackage: () => Promise.resolve({ problem: 'offline' }),
    },
    keys: {},
    sealingKey: Buffer.alloc(32, 3),
    redirectUri: `${TEST_ORIGIN}/api/plugins/oauth/callback`,
    apiVersion: '1.0.0',
    enqueueSchedule: vi.fn(() => Promise.resolve()),
    log: vi.fn(),
  });
  const app = createApp({
    auth,
    settings,
    permissions,
    plugins: () => service,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });
  const cookie = await signUpForTest(app);
  const accountId = store.user[0]?.id ?? '';

  if (granted.includes('administrator')) {
    await makeAdministrator(permissions, accountId);
  } else {
    const role = await permissions.createRole({
      name: 'Purpose-made',
      position: 200,
      color: null,
      permissions: [...granted],
    });

    await permissions.assignRole(accountId, role.id);
  }

  const request = (path: string, init: RequestInit = {}, withCookie = true) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      ...init,
      headers: {
        ...(withCookie ? { cookie } : {}),
        origin: TEST_ORIGIN,
        ...init.headers,
      },
    });

  const install = async () => {
    const preview = PreviewAnswer.parse(
      await (await request('/api/plugins/upload', { method: 'POST', body: PACKAGE })).json(),
    );

    return request('/api/plugins/install', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: preview.token,
        acceptedPermissionsHash: preview.permissionsHash,
        acceptUnsigned: true,
      }),
    });
  };

  return { request, install, service, accountId };
};

describe('the plugin routes', () => {
  it('keeps managing plugins to whoever holds server.plugins', async () => {
    const { request } = await signedInWith([]);

    expect((await request('/api/plugins')).status).toBe(403);
    expect((await request('/api/plugins', {}, false)).status).toBe(401);
    expect((await request('/api/plugins/upload', { method: 'POST', body: PACKAGE })).status).toBe(
      403,
    );
  });

  it('uploads marked unsigned, installs, and lists the plugin with the redirect address', async () => {
    const { request, install, service } = await signedInWith(['server.plugins']);
    const preview = PreviewAnswer.parse(
      await (await request('/api/plugins/upload', { method: 'POST', body: PACKAGE })).json(),
    );

    expect(preview.trust).toBe('unsigned');
    expect(preview.warnings).toEqual([]);

    const installed = await install();

    expect(installed.status).toBe(201);
    expect(InstalledPluginSchema.parse(await installed.json()).id).toBe('route-test');
    const listed = InstalledPluginsSchema.parse(await (await request('/api/plugins')).json());

    expect(listed.plugins).toHaveLength(1);
    expect(listed.redirectUri).toBe(`${TEST_ORIGIN}/api/plugins/oauth/callback`);

    service.stop();
  });

  it('refuses an upload that is not a plugin', async () => {
    const { request } = await signedInWith(['server.plugins']);

    expect(
      (await request('/api/plugins/upload', { method: 'POST', body: new Uint8Array([1, 2]) }))
        .status,
    ).toBe(422);
  });

  it('draws a page for the person asking, and answers act with a surface and where to go', async () => {
    const { request, install, service, accountId } = await signedInWith(['server.plugins']);

    await install();

    const contributions = PluginContributionsSchema.parse(
      await (await request('/api/plugins/contributions')).json(),
    );

    expect(contributions.pages.map((page) => page.pageId)).toEqual(['home']);
    expect(await (await request('/api/plugins/route-test/pages/home')).json()).toEqual({
      blocks: [{ type: 'text', text: `Hello ${accountId}` }],
    });

    const connect = PluginActAnswerSchema.parse(
      await (
        await request('/api/plugins/route-test/pages/home/act', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
            fields: {},
          }),
        })
      ).json(),
    );

    expect(connect.navigate).toMatch(
      /^\/api\/plugins\/route-test\/accounts\/anilist\/connect\?ticket=/,
    );
    expect(connect.surface).toEqual({ blocks: [{ type: 'text', text: `Hello ${accountId}` }] });
    expect((await request('/api/plugins/route-test/pages/home', {}, false)).status).toBe(401);
    expect((await request('/api/plugins/nothing-here/pages/home')).status).toBe(404);

    service.stop();
  }, 30_000);

  it('connects from a browser with no session, by ticket, and binds the callback to that browser', async () => {
    const { request, install, service } = await signedInWith(['server.plugins']);

    await install();
    await request('/api/plugins/route-test', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ settings: { clientId: 'client-1' } }),
    });

    const acted = PluginActAnswerSchema.parse(
      await (
        await request('/api/plugins/route-test/pages/home/act', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
            fields: {},
          }),
        })
      ).json(),
    );
    const started = await request(acted.navigate ?? '', {}, false);

    expect(started.status).toBe(302);
    expect(started.headers.get('location')).toMatch(
      /^https:\/\/anilist\.co\/api\/v2\/oauth\/authorize\?/,
    );
    const cookie = started.headers.get('set-cookie') ?? '';

    expect(cookie).toMatch(/^valence-plugin-connect=[\w-]{20,};/);
    expect(cookie).toContain('Max-Age=600');
    expect(cookie).toContain('Path=/api/plugins/oauth');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const again = await request(acted.navigate ?? '', {}, false);

    expect(again.status).toBe(422);
    expect(again.headers.get('content-type')).toContain('text/html');
    expect(await again.text()).toContain('That link has expired');

    const state = new URL(started.headers.get('location') ?? '').searchParams.get('state') ?? '';
    const elsewhere = await request(
      `/api/plugins/oauth/callback?state=${state}&code=abc`,
      {},
      false,
    );

    expect(elsewhere.status).toBe(422);
    expect(await elsewhere.text()).toContain('started somewhere else');
    expect(elsewhere.headers.get('content-security-policy')).toContain("default-src 'none'");

    const turnedDown = await request('/api/plugins/oauth/callback?error=access_denied', {}, false);

    expect(turnedDown.status).toBe(422);
    expect(await turnedDown.text()).toContain('turned down');

    service.stop();
  }, 30_000);

  it('will not connect with no ticket and no session', async () => {
    const { request, install } = await signedInWith(['server.plugins']);

    await install();

    const refused = await request('/api/plugins/route-test/accounts/anilist/connect', {}, false);

    expect(refused.status).toBe(422);
    expect(await refused.text()).toContain('Sign in to Valence first');
  });

  it('uninstalls, and forgets the plugin', async () => {
    const { request, install } = await signedInWith(['server.plugins']);

    await install();

    expect((await request('/api/plugins/route-test', { method: 'DELETE' })).status).toBe(204);
    expect((await request('/api/plugins/route-test', { method: 'DELETE' })).status).toBe(404);
  });

  it('documents itself in the specification, a surface’s blocks nesting by reference', async () => {
    const { request } = await signedInWith(['server.plugins']);

    const answer = await request('/api/openapi.json');
    const spec = z
      .object({
        paths: z.record(z.string(), z.object({})),
        components: z.object({ schemas: z.record(z.string(), z.json()) }),
      })
      .parse(await answer.json());

    expect(answer.status).toBe(200);
    expect(Object.keys(spec.paths)).toContain('/api/plugins/{id}/pages/{page}');
    expect(JSON.stringify(spec.components.schemas['PluginSurfaceBlock'])).toContain(
      '#/components/schemas/PluginSurfaceBlock',
    );
  });

  it('takes a webhook at the plugin’s private address from anybody, and nothing at a wrong one', async () => {
    const { request, install, service } = await signedInWith(['server.plugins']);

    await install();

    const listed = InstalledPluginsSchema.parse(await (await request('/api/plugins')).json());
    const address = new URL(listed.plugins[0]?.webhooks[0]?.url ?? '');
    const path = address.pathname;
    const post = (at: string, body: string) =>
      request(at, { method: 'POST', body, headers: { 'content-type': 'application/json' } }, false);

    expect((await post(path, '{"hello":true}')).status).toBe(204);
    expect((await post(`${path.slice(0, -4)}abcd`, '{}')).status).toBe(404);
    expect((await post(path.replace('/ping/', '/pong/'), '{}')).status).toBe(404);
    expect((await post(path, 'x'.repeat(300 * 1024))).status).toBe(413);

    service.stop();
  }, 30_000);
});
