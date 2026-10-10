import { describe, expect, it } from 'vitest';
import { twoLinkingServers } from '@ValenceServer/testing/twoLinkingServers';
import { createLinkSharingService } from './createLinkSharingService';
import { createMemoryLinkSharingStore } from './createMemoryLinkSharingStore';
import { createPeerClaims } from './createPeerClaims';
import type { PeerClient } from './createPeerClient';
import type { LinkSharingService } from './LinkSharingService';
import type { PeerItem } from './PeerItem';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const MUSIC = '00000000-0000-4000-8000-0000000000e1';

const ARRIVAL = '00000000-0000-4000-8000-000000000a01';

const ALIEN = '00000000-0000-4000-8000-000000000a02';

const ITEMS: readonly PeerItem[] = [
  { id: ARRIVAL, title: 'Arrival', libraryId: FILMS, certificationAge: 12, isNeverRated: false },
  { id: ALIEN, title: 'Alien', libraryId: FILMS, certificationAge: 18, isNeverRated: false },
];

const LIBRARIES = [
  { id: FILMS, name: 'Films', kind: 'movies' },
  { id: MUSIC, name: 'Music', kind: 'music' },
] as const;

/**
 * Anime and Films, linked, each with a sharing service; Anime holds the libraries, and Films
 * reaches Anime's sharing service as it would over the network.
 *
 * @param limits - How often Anime lets a server and a person ask.
 * @returns Both services, the ids each knows the other by, and what Anime warned about.
 */
const twoSharingServers = async (limits?: { perServer: number; perPerson: number }) => {
  const { anime, films, animeStore, filmsStore, link } = twoLinkingServers();
  const { filmsAtAnime, animeAtFilms } = await link();
  const warned: string[] = [];
  const at = new Map<string, LinkSharingService>();
  let ticks = 0;
  const ticking = () => {
    ticks += 1;

    return new Date(Date.UTC(2026, 9, 2, 12) + ticks * 1000);
  };

  const claims = createPeerClaims();
  const asking = (address: string, path: string, token: string) =>
    at.get(address)?.admit({ method: 'GET', path, authorization: `Bearer ${token}` });

  const peers: PeerClient = {
    identityAt: () => Promise.resolve(null),
    pair: () => Promise.resolve({ kind: 'unreachable' }),
    pairingState: () => Promise.resolve({ kind: 'unreachable' }),
    tellUnlinked: () => Promise.resolve(false),
    tellChanged: () => Promise.resolve(false),
    pictureAt: () => Promise.resolve(null),
    libraries: async (address, token) => {
      const admitted = await asking(address, '/api/federation/v1/libraries', token);

      return admitted?.kind === 'admitted'
        ? {
            kind: 'answered',
            answer: {
              libraries: (await at.get(address)?.sharedWith(admitted.serverId)) ?? [],
              allowsDownloads: admitted.sharing?.allowsDownloads ?? false,
              takesRequests: admitted.sharing?.takesTheirRequests ?? false,
            },
          }
        : { kind: 'refused', code: admitted?.kind === 'refused' ? admitted.code : '404' };
    },
    activity: async (address, token) => {
      const admitted = await asking(address, '/api/federation/v1/activity', token);
      const entries =
        admitted?.kind === 'admitted'
          ? await at.get(address)?.activityFor(admitted.serverId)
          : null;

      return entries === null || entries === undefined
        ? { kind: 'refused', code: 'error.linking.thatServerDoesNotShowItsRecord' }
        : { kind: 'answered', answer: entries };
    },
    catalogue: () => Promise.resolve({ kind: 'unreachable' }),
    passThrough: () => Promise.resolve(null),
  };

  const animeSharing = createLinkSharingService({
    linking: anime,
    links: animeStore,
    sharing: createMemoryLinkSharingStore(async (id) => (await animeStore.readServer(id)) !== null),
    libraries: () => Promise.resolve([...LIBRARIES]),
    subjectOf: ({ kind, id }) =>
      Promise.resolve(kind === 'item' ? (ITEMS.find((item) => item.id === id) ?? null) : null),
    claims,
    peers,
    warn: (message) => warned.push(message),
    now: ticking,
    ...(limits === undefined ? {} : { limits }),
  });
  const filmsSharing = createLinkSharingService({
    linking: films,
    links: filmsStore,
    sharing: createMemoryLinkSharingStore(async (id) => (await filmsStore.readServer(id)) !== null),
    libraries: () => Promise.resolve([]),
    subjectOf: () => Promise.resolve(null),
    claims: createPeerClaims(),
    peers,
  });

  at.set('https://anime.example', animeSharing);

  /**
   * What Anime makes of Films asking for something.
   *
   * @param path - What Films asks for, under the federation address.
   * @param person - Who on Films it asks for, if anybody.
   * @returns Anime's answer.
   */
  const filmsAsks = async (
    path: string,
    person?: { profileId: string; name: string },
    method = 'GET',
  ) => {
    const signed =
      person === undefined
        ? await films.signFor(animeAtFilms)
        : await filmsSharing.askAs(animeAtFilms, person);

    return animeSharing.admit({
      method,
      path: `/api/federation/v1${path}`,
      authorization: `Bearer ${signed?.token ?? ''}`,
    });
  };

  return { animeSharing, filmsSharing, filmsAtAnime, animeAtFilms, filmsAsks, warned, claims };
};

describe('createLinkSharingService', () => {
  it('passes the pairing routes through, and refuses anything not signed by a linked server', async () => {
    const { animeSharing } = await twoSharingServers();

    expect(
      await animeSharing.admit({
        method: 'POST',
        path: '/api/federation/v1/pair',
        authorization: undefined,
      }),
    ).toEqual({ kind: 'pairing' });
    expect(
      await animeSharing.admit({
        method: 'GET',
        path: '/api/federation/v1/libraries',
        authorization: 'Bearer not-a-token',
      }),
    ).toEqual({ kind: 'refused', status: 401, code: 'error.linking.notSignedByALinkedServer' });
  });

  it('shares nothing until its admin chooses, then only the libraries chosen', async () => {
    const { animeSharing, filmsSharing, filmsAtAnime, animeAtFilms, filmsAsks } =
      await twoSharingServers();

    expect(await filmsAsks('/libraries')).toMatchObject({
      kind: 'admitted',
      serverId: filmsAtAnime,
      action: 'libraries',
    });
    expect(await animeSharing.sharedWith(filmsAtAnime)).toEqual([]);

    await animeSharing.changeSharing(filmsAtAnime, { libraryIds: [FILMS] });

    expect(await filmsSharing.theirLibraries(animeAtFilms)).toEqual({
      isReachable: true,
      libraries: [{ ...LIBRARIES[0], isTaken: true }],
    });
  });

  it('reads only a shared library’s catalogue', async () => {
    const { animeSharing, filmsAtAnime, filmsAsks } = await twoSharingServers();

    await animeSharing.changeSharing(filmsAtAnime, { libraryIds: [FILMS] });

    expect(await filmsAsks(`/catalogue/${FILMS}`)).toMatchObject({
      kind: 'admitted',
      libraryId: FILMS,
    });
    expect(await filmsAsks(`/catalogue/${MUSIC}`)).toMatchObject({ kind: 'refused', status: 403 });
  });

  it('reaches a session only where the asking server started it, naming what it plays', async () => {
    const { filmsAtAnime, filmsAsks, claims } = await twoSharingServers();

    expect(await filmsAsks('/api/playback/session/one/index.m3u8')).toMatchObject({
      kind: 'refused',
      status: 403,
    });

    claims.claim('session', 'one', filmsAtAnime, { mediaId: ARRIVAL, title: 'Arrival' });

    expect(await filmsAsks('/api/playback/session/one/index.m3u8')).toMatchObject({
      kind: 'admitted',
      inner: '/api/playback/session/one/index.m3u8',
      title: { mediaId: ARRIVAL, title: 'Arrival' },
    });
  });

  it('refuses the other server its record where its admin does not show it', async () => {
    const { animeSharing, filmsAtAnime, filmsAsks } = await twoSharingServers();

    expect(await filmsAsks('/activity')).toEqual({
      kind: 'refused',
      status: 403,
      code: 'error.linking.thatServerDoesNotShowItsRecord',
    });

    await animeSharing.changeSharing(filmsAtAnime, { showsActivity: true });

    expect((await filmsAsks('/activity')).kind).toBe('admitted');
  });

  it('refuses a route it does not name, and says so where an admin will see it', async () => {
    const { filmsAsks, warned } = await twoSharingServers();

    expect(await filmsAsks('/accounts')).toEqual({
      kind: 'refused',
      status: 403,
      code: 'error.linking.thatIsNotSharedWithYourServer',
    });
    expect(warned).toEqual([expect.stringContaining('/api/federation/v1/accounts')]);
  });

  it('reaches a title only in a shared library and within the age, and keeps a record of each', async () => {
    const { animeSharing, filmsAtAnime, filmsAsks } = await twoSharingServers();
    const sam = { profileId: 'sam', name: 'Sam' };

    expect((await filmsAsks(`/api/media/${ARRIVAL}/image/poster`, sam)).kind).toBe('refused');

    await animeSharing.changeSharing(filmsAtAnime, { libraryIds: [FILMS], maximumAge: 15 });

    expect((await filmsAsks(`/api/media/${ARRIVAL}/image/poster`, sam)).kind).toBe('admitted');
    expect((await filmsAsks(`/api/media/${ALIEN}/image/poster`, sam)).kind).toBe('refused');
    expect((await filmsAsks(`/api/media/${MUSIC}/image/poster`, sam)).kind).toBe('refused');

    const record = await animeSharing.activity(filmsAtAnime);

    expect(record?.map((entry) => [entry.mediaTitle, entry.outcome, entry.personName])).toEqual([
      [null, 'notShared', 'Sam'],
      ['Alien', 'aboveTheAge', 'Sam'],
      ['Arrival', 'allowed', 'Sam'],
      ['Arrival', 'notShared', 'Sam'],
    ]);
  });

  it('turns away a person its admin blocked, and only them', async () => {
    const { animeSharing, filmsAtAnime, filmsAsks } = await twoSharingServers();

    await animeSharing.changeSharing(filmsAtAnime, { libraryIds: [FILMS] });
    await filmsAsks('/libraries', { profileId: 'sam', name: 'Sam' });

    const [sam] = (await animeSharing.people(filmsAtAnime)) ?? [];

    expect(sam?.name).toBe('Sam');

    await animeSharing.block(filmsAtAnime, sam?.id ?? '', true);

    expect(
      await filmsAsks(`/api/media/${ARRIVAL}/image/poster`, { profileId: 'sam', name: 'Sam' }),
    ).toEqual({
      kind: 'refused',
      status: 403,
      code: 'error.linking.thisPersonMayNotWatchFromHere',
    });
    expect(
      (await filmsAsks(`/api/media/${ARRIVAL}/image/poster`, { profileId: 'kai', name: 'Kai' }))
        .kind,
    ).toBe('admitted');

    await animeSharing.block(filmsAtAnime, sam?.id ?? '', false);

    expect(
      (await filmsAsks(`/api/media/${ARRIVAL}/image/poster`, { profileId: 'sam', name: 'Sam' }))
        .kind,
    ).toBe('admitted');
  });

  it('slows down a server, or one of its people, asking too often', async () => {
    const { filmsAsks } = await twoSharingServers({ perServer: 3, perPerson: 1 });
    const sam = { profileId: 'sam', name: 'Sam' };

    expect((await filmsAsks('/libraries', sam)).kind).toBe('admitted');
    expect(await filmsAsks('/libraries', sam)).toMatchObject({ status: 429 });
    expect((await filmsAsks('/libraries')).kind).toBe('admitted');
    expect(await filmsAsks('/libraries')).toMatchObject({ status: 429 });
  });

  it('sends a person’s name only where its admin lets names travel', async () => {
    const { animeSharing, filmsSharing, filmsAtAnime, animeAtFilms, filmsAsks } =
      await twoSharingServers();

    await filmsSharing.changeSharing(animeAtFilms, { namesTravel: false });
    await filmsAsks('/libraries', { profileId: 'sam', name: 'Sam' });

    expect((await animeSharing.people(filmsAtAnime))?.[0]?.name).toBeNull();
  });

  it('lets the other server read its record of their people only where its admin allows', async () => {
    const { animeSharing, filmsSharing, filmsAtAnime, animeAtFilms, filmsAsks } =
      await twoSharingServers();

    await filmsAsks('/libraries', { profileId: 'sam', name: 'Sam' });

    expect(await filmsSharing.theirActivity(animeAtFilms)).toEqual({
      standing: 'notShown',
      entries: [],
    });

    await animeSharing.changeSharing(filmsAtAnime, { showsActivity: true });

    const theirs = await filmsSharing.theirActivity(animeAtFilms);

    expect(theirs?.standing).toBe('shown');
    expect(theirs?.entries.some((entry) => entry.personName === 'Sam')).toBe(true);
  });

  it('refuses to share a library it does not have, or with a server it does not know', async () => {
    const { animeSharing, filmsAtAnime } = await twoSharingServers();

    expect(
      await animeSharing.changeSharing(filmsAtAnime, {
        libraryIds: ['00000000-0000-4000-8000-000000000000'],
      }),
    ).toEqual({ kind: 'noSuchLibrary' });
    expect(
      await animeSharing.changeSharing('00000000-0000-4000-8000-000000000000', {
        showsActivity: true,
      }),
    ).toEqual({ kind: 'noSuchServer' });
    expect(await animeSharing.people('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(await animeSharing.theirLibraries('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(await animeSharing.theirActivity('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(await animeSharing.activity('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(
      await animeSharing.askAs('00000000-0000-4000-8000-000000000000', {
        profileId: 'sam',
        name: 'Sam',
      }),
    ).toBeNull();
  });
});
