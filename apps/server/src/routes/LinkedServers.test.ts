import { describe, expect, it } from 'vitest';
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
import { createLinkService } from '@ValenceServer/linking/createLinkService';
import { createMemoryLinkStore } from '@ValenceServer/linking/createMemoryLinkStore';
import { createPeerClient } from '@ValenceServer/linking/createPeerClient';
import { linkSettingsOf } from '@ValenceServer/linking/linkSettingsOf';
import {
  LinkedServerSchema,
  LinkingSchema,
  MadeLinkInviteSchema,
  ServerIdentitySchema,
} from '@ValenceContracts/schemas/LinkedServer';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import type { Permission } from '@ValenceContracts/schemas/Permission';

type App = ReturnType<typeof createApp>;

/**
 * Two Valence servers that reach each other by the addresses they are known at, through each
 * other's real routes, with nobody's network in between.
 *
 * @returns A way to start a server at an address, signed in with the given permissions.
 */
const aNetwork = () => {
  const at = new Map<string, App>();
  const fetcher: typeof fetch = (input, init) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    );
    const app = at.get(url.origin);

    return app === undefined
      ? Promise.reject(new Error(`nothing answers at ${url.origin}`))
      : Promise.resolve(app.request(`${url.pathname}${url.search}`, init));
  };

  const serverAt = async (address: string, granted: readonly Permission[] = ['administrator']) => {
    const { auth, settings, store } = createMemoryAuth();
    const permissions = createMemoryPermissionService();
    const app = createApp({
      auth,
      settings,
      permissions,
      linking: createLinkService({
        store: createMemoryLinkStore(),
        settings: linkSettingsOf(settings),
        address,
        defaultName: new URL(address).hostname,
        peers: createPeerClient(fetcher),
      }),
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

    at.set(address, app);

    const cookie = await signUpForTest(app);
    const account = store.user[0];

    if (granted.includes('administrator')) {
      await makeAdministrator(permissions, account?.id ?? '');
    } else {
      const role = await permissions.createRole({
        name: 'Purpose-made',
        position: 200,
        color: null,
        permissions: [...granted],
      });

      await permissions.assignRole(account?.id ?? '', role.id);
    }

    const request = (path: string, method = 'GET', body?: object) =>
      app.request(`${TEST_ORIGIN}${path}`, {
        method,
        headers: {
          cookie,
          origin: TEST_ORIGIN,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

    const linking = async () =>
      LinkingSchema.parse(await (await request('/api/linked-servers')).json());

    return { app, request, linking };
  };

  return { serverAt };
};

describe('the linked server routes', () => {
  it('says who a server is to anybody, without its address', async () => {
    const anime = await aNetwork().serverAt('https://anime.example');

    const answered = await anime.app.request('/api/federation/v1/server');
    const said = ServerIdentitySchema.strict().parse(await answered.json());

    expect(answered.status).toBe(200);
    expect(said.name).toBe('anime.example');
    expect(said.protocols).toContain('valence-link/1');
  });

  it('links two servers through an invite, its approval and a check', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');

    const made = MadeLinkInviteSchema.parse(
      await (await anime.request('/api/linked-servers/invites', 'POST')).json(),
    );
    const used = await films.request('/api/linked-servers', 'POST', { invite: made.invite });
    const waiting = LinkedServerSchema.parse(await used.json());

    expect(used.status).toBe(201);
    expect(waiting).toMatchObject({ name: 'anime.example', state: 'awaitingThem' });

    const asking = (await anime.linking()).servers[0];

    expect(asking).toMatchObject({ name: 'films.example', state: 'awaitingUs' });

    await anime.request(`/api/linked-servers/${asking?.id ?? ''}/approve`, 'POST');

    const checked = LinkedServerSchema.parse(
      await (await films.request(`/api/linked-servers/${waiting.id}/check`, 'POST')).json(),
    );

    expect(checked.state).toBe('linked');
  });

  it('refuses an invite used twice, and one that is not an invite, saying why', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const music = await network.serverAt('https://music.example');
    const { invite } = MadeLinkInviteSchema.parse(
      await (await anime.request('/api/linked-servers/invites', 'POST')).json(),
    );

    await films.request('/api/linked-servers', 'POST', { invite });

    const again = await music.request('/api/linked-servers', 'POST', { invite });

    expect(again.status).toBe(400);
    expect(RefusalSchema.parse(await again.json()).code).toBe(
      'error.linking.thatInviteHasBeenUsed',
    );

    const nonsense = await music.request('/api/linked-servers', 'POST', {
      invite: 'valence-link:nonsense',
    });

    expect(RefusalSchema.parse(await nonsense.json()).code).toBe('error.linking.thatIsNotAnInvite');
  });

  it('says a server could not be reached', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const { invite } = MadeLinkInviteSchema.parse(
      await (await anime.request('/api/linked-servers/invites', 'POST')).json(),
    );

    await anime.request('/api/linked-servers/identity', 'PATCH', {
      address: 'https://moved.example',
    });

    const fresh = MadeLinkInviteSchema.parse(
      await (await anime.request('/api/linked-servers/invites', 'POST')).json(),
    );
    const answered = await films.request('/api/linked-servers', 'POST', { invite: fresh.invite });

    expect(answered.status).toBe(502);
    expect(invite).not.toBe(fresh.invite);
  });

  it('believes no federation question that was not signed by a server it knows', async () => {
    const anime = await aNetwork().serverAt('https://anime.example');

    const asked = await anime.app.request(
      '/api/federation/v1/pair/00000000-0000-4000-8000-000000000001',
      { headers: { authorization: 'Bearer not-a-token' } },
    );

    expect(asked.status).toBe(404);

    const unlinked = await anime.app.request('/api/federation/v1/unlink', {
      method: 'POST',
      headers: { authorization: 'Bearer not-a-token' },
    });

    expect(unlinked.status).toBe(404);
  });

  it('keeps linking to whoever may do it', async () => {
    const network = aNetwork();
    const member = await network.serverAt('https://anime.example', ['streaming.view']);

    expect((await member.request('/api/linked-servers')).status).toBe(403);
    expect((await member.request('/api/linked-servers/invites', 'POST')).status).toBe(403);

    const linker = await network.serverAt('https://films.example', ['server.links']);

    expect((await linker.request('/api/linked-servers')).status).toBe(200);
  });

  it('withdraws an invite, and unlinks from a server', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const made = MadeLinkInviteSchema.parse(
      await (await anime.request('/api/linked-servers/invites', 'POST')).json(),
    );

    expect((await anime.request(`/api/linked-servers/invites/${made.id}`, 'DELETE')).status).toBe(
      204,
    );
    expect((await anime.linking()).invites).toEqual([]);

    const again = MadeLinkInviteSchema.parse(
      await (await anime.request('/api/linked-servers/invites', 'POST')).json(),
    );
    const waiting = LinkedServerSchema.parse(
      await (await films.request('/api/linked-servers', 'POST', { invite: again.invite })).json(),
    );

    expect((await films.request(`/api/linked-servers/${waiting.id}`, 'DELETE')).status).toBe(204);
    expect((await films.linking()).servers).toEqual([]);
    expect((await anime.linking()).servers[0]?.state).toBe('unlinkedByThem');
  });
});
