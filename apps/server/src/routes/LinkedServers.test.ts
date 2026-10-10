import { describe, expect, it, vi } from 'vitest';
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
import { createMemoryLinkStore } from '@ValenceServer/linking/createMemoryLinkStore';
import { createMemoryLinkSharingStore } from '@ValenceServer/linking/createMemoryLinkSharingStore';
import { createPeerClient } from '@ValenceServer/linking/createPeerClient';
import { createLinkService } from '@ValenceServer/linking/createLinkService';
import { linkSettingsOf } from '@ValenceServer/linking/linkSettingsOf';
import { signAsPerson } from '@ValenceServer/linking/signAsPerson';
import { createPartyRelayHub } from '@ValenceServer/linking/parties/createPartyRelayHub';
import { createPartyRegistry } from '@ValenceServer/parties/createPartyRegistry';
import {
  LinkedServerSchema,
  LinkingSchema,
  MadeLinkInviteSchema,
  ServerIdentitySchema,
} from '@ValenceContracts/schemas/LinkedServer';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  AskableElsewhereSchema,
  FederationActivityListSchema,
  LinkedServerFacesSchema,
  RemotePeopleSchema,
  LinkSharingSchema,
  TheirActivitySchema,
  TheirLibrariesSchema,
} from '@ValenceContracts/schemas/LinkSharing';
import { LibrarySchema } from '@ValenceContracts/schemas/Library';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';

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

  const serverAt = async (
    address: string,
    granted: readonly Permission[] = ['administrator'],
    libraries: readonly Library[] = [],
    extra: Partial<NonNullable<CreateAppOptions['linking']>> = {},
  ) => {
    const { auth, settings, store } = createMemoryAuth();
    const permissions = createMemoryPermissionService();
    const links = createMemoryLinkStore();
    const sharing = createMemoryLinkSharingStore(
      async (id) => (await links.readServer(id)) !== null,
    );
    const peers = createPeerClient(fetcher);
    const service = createLinkService({
      store: links,
      settings: linkSettingsOf(settings),
      address,
      defaultName: new URL(address).hostname,
      peers,
    });
    const app = createApp({
      auth,
      settings,
      permissions,
      linking: {
        service,
        store: links,
        sharing,
        address,
        defaultName: new URL(address).hostname,
        peers,
        ask: async (serverId, route, asking) => {
          const signed = await service.signFor(serverId);

          return signed === null
            ? null
            : peers.passThrough(signed.address, signed.token, route, asking);
        },
        ...extra,
      },
      countUsers: () => Promise.resolve(1),
      promoteToAdmin: () => Promise.resolve(null),
      library: createMemoryLibraryService({ libraries: [...libraries], media: [] }),
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

    /**
     * Asks a linked server something at its federation address, signed as this server, or as
     * somebody on it.
     *
     * @param serverId - The linked server, as this one knows it.
     * @param route - What to ask for, under the federation address.
     * @param method - How.
     * @param body - What to send, if anything.
     * @param person - Who on this server is asking, if anybody.
     * @returns The answer.
     */
    const askAt = async (
      serverId: string,
      route: string,
      method = 'GET',
      body?: object,
      person: { profileId: string; name: string } | null = null,
    ) => {
      const signed = await signAsPerson(service, sharing, serverId, person);

      return fetcher(`${signed?.address ?? ''}/api/federation/v1${route}`, {
        method,
        headers: {
          authorization: `Bearer ${signed?.token ?? ''}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    };

    return { app, request, linking, askAt };
  };

  return { serverAt };
};

const FILMS = LibrarySchema.parse({
  id: '00000000-0000-4000-8000-0000000000f1',
  name: 'Films',
  kind: 'movies',
  path: '/films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
});

const ANIME = LibrarySchema.parse({
  ...FILMS,
  id: '00000000-0000-4000-8000-0000000000a1',
  name: 'Anime',
  kind: 'shows',
  path: '/anime',
});

type Server = Awaited<ReturnType<ReturnType<typeof aNetwork>['serverAt']>>;

/**
 * Links two servers through their routes, the way two admins would.
 *
 * @param host - The server that makes the invite and approves.
 * @param guest - The server that uses it.
 * @returns The id each knows the other by.
 */
const linkThem = async (host: Server, guest: Server) => {
  const { invite } = MadeLinkInviteSchema.parse(
    await (await host.request('/api/linked-servers/invites', 'POST')).json(),
  );
  const hostAtGuest = LinkedServerSchema.parse(
    await (await guest.request('/api/linked-servers', 'POST', { invite })).json(),
  ).id;
  const guestAtHost = (await host.linking()).servers[0]?.id ?? '';

  await host.request(`/api/linked-servers/${guestAtHost}/approve`, 'POST');
  await guest.request(`/api/linked-servers/${hostAtGuest}/check`, 'POST');

  return { guestAtHost, hostAtGuest };
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

  it('shares only the libraries its admin chooses with a linked server, and keeps a record', async () => {
    const network = aNetwork();
    const anime = await network.serverAt(
      'https://anime.example',
      ['administrator'],
      [FILMS, ANIME],
    );
    const films = await network.serverAt('https://films.example');
    const { guestAtHost, hostAtGuest } = await linkThem(anime, films);
    const theirs = async () =>
      TheirLibrariesSchema.parse(
        await (await films.request(`/api/linked-servers/${hostAtGuest}/their-libraries`)).json(),
      );

    expect(await theirs()).toEqual({ isReachable: true, libraries: [] });

    const shared = await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      libraryIds: [FILMS.id],
    });

    expect(LinkSharingSchema.parse(await shared.json()).libraryIds).toEqual([FILMS.id]);
    expect(await theirs()).toEqual({
      isReachable: true,
      libraries: [{ id: FILMS.id, name: 'Films', kind: 'movies', isTaken: true }],
    });

    const record = FederationActivityListSchema.parse(
      await (await anime.request(`/api/linked-servers/${guestAtHost}/activity`)).json(),
    );

    expect(record.entries).toEqual([
      expect.objectContaining({ action: 'libraries', outcome: 'allowed', count: 2 }),
    ]);
  });

  it('lets a linked server read its record of their people only where its admin allows', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const { guestAtHost, hostAtGuest } = await linkThem(anime, films);
    const theirs = async () =>
      TheirActivitySchema.parse(
        await (await films.request(`/api/linked-servers/${hostAtGuest}/their-activity`)).json(),
      );

    expect((await theirs()).standing).toBe('notShown');

    await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      showsActivity: true,
    });

    expect((await theirs()).standing).toBe('shown');
  });

  it('closes the federation address to anything not signed by a linked server', async () => {
    const anime = await aNetwork().serverAt('https://anime.example');

    for (const path of ['/libraries', '/activity', '/accounts', '/media/x']) {
      const asked = await anime.app.request(`/api/federation/v1${path}`, {
        headers: { authorization: 'Bearer not-a-token' },
      });

      expect(asked.status).toBe(401);
      expect(RefusalSchema.parse(await asked.json()).code).toBe(
        'error.linking.notSignedByALinkedServer',
      );
    }
  });

  it('refuses to share a library it does not have, and keeps sharing to whoever may link', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example', ['administrator'], [FILMS]);
    const films = await network.serverAt('https://films.example');
    const { guestAtHost } = await linkThem(anime, films);
    const nothing = await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      libraryIds: [ANIME.id],
    });

    expect(nothing.status).toBe(400);
    expect(
      (await anime.request('/api/linked-servers/00000000-0000-4000-8000-000000000000/sharing'))
        .status,
    ).toBe(404);

    const member = await network.serverAt('https://music.example', ['streaming.view']);

    expect((await member.request(`/api/linked-servers/${guestAtHost}/sharing`)).status).toBe(403);
    expect((await member.request(`/api/linked-servers/${guestAtHost}/people`)).status).toBe(403);
  });

  it('serves only a shared library’s catalogue to a linked server', async () => {
    const network = aNetwork();
    const page = {
      series: [],
      mediaItems: [],
      artists: [],
      albums: [],
      tracks: [],
      trackArtists: [],
      books: [],
      chapters: [],
      next: null,
    };
    const anime = await network.serverAt('https://anime.example', ['administrator'], [FILMS], {
      catalogue: () => Promise.resolve(page),
    });
    const films = await network.serverAt('https://films.example');
    const { guestAtHost, hostAtGuest } = await linkThem(anime, films);

    expect((await films.askAt(hostAtGuest, `/catalogue/${FILMS.id}`)).status).toBe(403);

    await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      libraryIds: [FILMS.id],
    });

    const read = await films.askAt(hostAtGuest, `/catalogue/${FILMS.id}`);

    expect(read.status).toBe(200);
    expect(await read.json()).toEqual(page);
  });

  it('passes a request on to its own routes only for a shared title, or a session it started', async () => {
    const network = aNetwork();
    const title = '00000000-0000-4000-8000-0000000000c1';
    const anime = await network.serverAt('https://anime.example', ['administrator'], [FILMS], {
      subjectOf: ({ id }) =>
        Promise.resolve(
          id === title
            ? {
                id,
                title: 'Arrival',
                libraryId: FILMS.id,
                certificationAge: 12,
                isNeverRated: false,
              }
            : null,
        ),
    });
    const films = await network.serverAt('https://films.example');
    const { guestAtHost, hostAtGuest } = await linkThem(anime, films);
    const poster = `/api/media/${title}/image/poster`;

    expect((await films.askAt(hostAtGuest, poster)).status).toBe(403);

    await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      libraryIds: [FILMS.id],
    });

    expect((await films.askAt(hostAtGuest, poster)).status).not.toBe(403);
    expect(
      (await films.askAt(hostAtGuest, '/api/playback/session/not-theirs/index.m3u8')).status,
    ).toBe(403);
    expect(
      (await films.askAt(hostAtGuest, '/direct', 'POST', { sessionId: 'not-theirs' })).status,
    ).toBe(403);
    expect((await films.askAt(hostAtGuest, '/direct', 'POST', { mediaId: title })).status).toBe(
      200,
    );
    expect(
      (await anime.app.request(`/api/federation/v1/direct/${'a'.repeat(43)}/index.m3u8`)).status,
    ).toBe(403);

    const record = FederationActivityListSchema.parse(
      await (await anime.request(`/api/linked-servers/${guestAtHost}/activity`)).json(),
    );

    expect(record.entries.map((entry) => [entry.mediaTitle, entry.outcome])).toContainEqual([
      'Arrival',
      'allowed',
    ]);
  });

  it('keeps every new limit it is given for a linked server', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const { guestAtHost } = await linkThem(anime, films);
    const changed = await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      mostStreams: 2,
      qualityCeiling: '1080p',
      takesTheirControls: false,
      allowsDownloads: true,
      takesTheirRequests: true,
      playsDirect: true,
    });

    expect(LinkSharingSchema.parse(await changed.json())).toMatchObject({
      mostStreams: 2,
      qualityCeiling: '1080p',
      takesTheirControls: false,
      allowsDownloads: true,
      takesTheirRequests: true,
      playsDirect: true,
    });
  });

  it('shows anybody signed in the servers it is linked with, and asks a server to read again', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example', ['administrator'], [], {
      syncServer: (id) =>
        Promise.resolve(
          id === '00000000-0000-4000-8000-000000000000'
            ? null
            : { serverId: id, libraries: 1, kept: 4, forgotten: 0 },
        ),
      isReachable: () => false,
      takesRequests: () => true,
    });
    const { hostAtGuest } = await linkThem(anime, films);
    const faces = LinkedServerFacesSchema.parse(
      await (await films.request('/api/linked-servers/faces')).json(),
    );

    expect(faces.servers).toHaveLength(1);
    expect(faces.servers[0]).toMatchObject({
      id: hostAtGuest,
      name: 'anime.example',
      isReachable: false,
      takesRequests: true,
    });
    expect(
      await (await films.request(`/api/linked-servers/${hostAtGuest}/sync`, 'POST')).json(),
    ).toEqual({ libraries: 1, kept: 4, forgotten: 0 });
    expect(
      (await films.request('/api/linked-servers/00000000-0000-4000-8000-000000000000/sync', 'POST'))
        .status,
    ).toBe(404);
  });

  it('names the people from a linked server who can be asked along, and none it blocked', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const { guestAtHost, hostAtGuest } = await linkThem(anime, films);

    await films.askAt(hostAtGuest, '/libraries', 'GET', undefined, {
      profileId: 'sam',
      name: 'Sam',
    });

    const askable = async () =>
      AskableElsewhereSchema.parse(await (await anime.request('/api/linked-servers/people')).json())
        .people;
    const [sam] = RemotePeopleSchema.parse(
      await (await anime.request(`/api/linked-servers/${guestAtHost}/people`)).json(),
    ).people;

    expect((await askable()).map((person) => person.name)).toEqual(['Sam from films.example']);

    await anime.request(`/api/linked-servers/${guestAtHost}/people/${sam?.id ?? ''}/block`, 'PUT');

    expect(await askable()).toEqual([]);
  });

  it('passes a request on to a linked server that takes them', async () => {
    const network = aNetwork();
    const anime = await network.serverAt('https://anime.example');
    const films = await network.serverAt('https://films.example');
    const { hostAtGuest } = await linkThem(anime, films);
    const ask = () =>
      films.request(`/api/linked-servers/${hostAtGuest}/requests`, 'POST', {
        kind: 'film',
        tmdbId: 603,
      });
    const refused = await ask();

    expect(RefusalSchema.parse(await refused.json()).code).toBe('error.common.requestingIsOff');
    expect(refused.status).toBe(503);

    expect(
      (
        await films.request(
          '/api/linked-servers/00000000-0000-4000-8000-000000000000/requests',
          'POST',
          {
            kind: 'film',
            tmdbId: 603,
          },
        )
      ).status,
    ).toBe(502);
  });

  it('lets somebody from a linked server join a party here on a shared title, and hear it', async () => {
    const network = aNetwork();
    const title = '00000000-0000-4000-8000-0000000000c1';
    const hub = createPartyRelayHub();
    let made = 0;
    const registry = createPartyRegistry(() => {
      made += 1;

      return `party-${made.toString()}`;
    });
    const asked = vi.fn(() => Promise.resolve());
    const anime = await network.serverAt('https://anime.example', ['administrator'], [FILMS], {
      subjectOf: ({ id }) =>
        Promise.resolve(
          id === title
            ? {
                id,
                title: 'Arrival',
                libraryId: FILMS.id,
                certificationAge: null,
                isNeverRated: false,
              }
            : null,
        ),
      parties: {
        hub,
        binding: {
          registry,
          tell: (connectionIds, payload) => {
            hub.tell(connectionIds.filter(hub.isPeer), payload);
          },
        },
        onAskedAlong: asked,
      },
    });
    const films = await network.serverAt('https://films.example');
    const { guestAtHost, hostAtGuest } = await linkThem(anime, films);
    const party = registry.open({
      mediaId: title,
      host: { connectionId: 'host-tab', accountId: 'dan', profileId: null, name: 'Dan' },
    });
    const join = () =>
      films.askAt(
        hostAtGuest,
        '/parties/say',
        'POST',
        { connection: 'tab-1', message: { kind: 'partyJoin', partyId: party.id } },
        { profileId: 'sam', name: 'Sam' },
      );
    const hear = async () =>
      JSON.stringify(await (await films.askAt(hostAtGuest, '/parties/hear?wait=0')).json());

    expect((await join()).status).toBe(204);
    expect(await hear()).toContain('error.linking.thatIsNotSharedWithYourServer');

    await anime.request(`/api/linked-servers/${guestAtHost}/sharing`, 'PATCH', {
      libraryIds: [FILMS.id],
    });
    await join();

    const heard = await hear();

    expect(heard).toContain('"connection":"tab-1"');
    expect(heard).toContain('here~tab-1');
    expect(registry.find(party.id)?.members.map((member) => member.name)).toEqual(['Dan', 'Sam']);

    const along = { pseudonym: 'kai', partyId: party.id, mediaId: title, byName: 'Dan' };

    expect((await films.askAt(hostAtGuest, '/parties/asked', 'POST', along)).status).toBe(204);
    expect(asked).toHaveBeenCalledWith(guestAtHost, along);
  });
});
