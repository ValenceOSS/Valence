import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { book, library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { twoLinkingServers } from '@ValenceServer/testing/twoLinkingServers';
import { createDatabaseLinkStore } from '@ValenceServer/linking/createDatabaseLinkStore';
import { createCatalogueReader } from './createCatalogueReader';
import { createCatalogueSync } from './createCatalogueSync';
import { localIdOf } from './localIdOf';
import type { SharedLibrary } from '@ValenceContracts/schemas/LinkSharing';
import type { PeerClient } from '@ValenceServer/linking/createPeerClient';

const STARTING_THE_DATABASE_MS = 120_000;

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const BOOKS = '00000000-0000-4000-8000-0000000000b1';

const ARRIVAL = '00000000-0000-4000-8000-0000000000a1';

const ALIEN = '00000000-0000-4000-8000-0000000000a2';

const MY_ARRIVAL = '00000000-0000-4000-8000-0000000000c1';

const SHARED: SharedLibrary[] = [
  { id: FILMS, name: 'Cinema', kind: 'movies' },
  { id: BOOKS, name: 'Shelf', kind: 'books' },
];

/**
 * Anime, holding two films and a book, linked with Films, which keeps its own copy of one of them
 * and mirrors what Anime shares into a database of its own.
 *
 * @returns Films' sync, its database, Anime's database, Anime's id at Films, and a way to change
 *   what Anime shares or make it unreachable.
 */
const mirroring = async () => {
  const host = await aMigratedDatabase();
  const here = await aMigratedDatabase();

  await host.insert(library).values([
    { id: FILMS, name: 'Cinema', kind: 'movies', path: '/films' },
    { id: BOOKS, name: 'Shelf', kind: 'books', path: '/books' },
  ]);
  await host
    .insert(mediaItem)
    .values([
      { ...aMediaItemRow(ARRIVAL, FILMS), externalId: 'tmdb:329865', posterUrl: '/posters/a.jpg' },
      aMediaItemRow(ALIEN, FILMS),
    ]);
  await host.insert(book).values({
    id: 'dune',
    libraryId: BOOKS,
    path: '/books/dune.epub',
    title: 'Dune',
    layout: 'reflow',
    direction: 'leftToRight',
  });
  await here.insert(library).values({ id: 'mine', name: 'Films', kind: 'movies', path: '/f' });
  await here
    .insert(mediaItem)
    .values({ ...aMediaItemRow(MY_ARRIVAL, 'mine'), externalId: 'tmdb:329865', height: 720 });

  const links = createDatabaseLinkStore(here);
  const { anime, add } = twoLinkingServers();
  const films = add('https://films.example', 'Films', links);
  const used = await films.useInvite((await anime.makeInvite()).invite);

  await anime.approve((await anime.linking()).servers[0]?.id ?? '');

  const animeAtFilms = used.kind === 'used' ? used.server.id : '';

  await films.check(animeAtFilms);

  const read = createCatalogueReader(host);
  const sharing = { shared: SHARED, isAway: false };
  const peers: PeerClient = {
    identityAt: () => Promise.resolve(null),
    pair: () => Promise.resolve({ kind: 'unreachable' }),
    pairingState: () => Promise.resolve({ kind: 'unreachable' }),
    tellUnlinked: () => Promise.resolve(false),
    tellChanged: () => Promise.resolve(false),
    libraries: () =>
      Promise.resolve(
        sharing.isAway
          ? { kind: 'unreachable' }
          : {
              kind: 'answered',
              answer: { libraries: sharing.shared, allowsDownloads: true, takesRequests: false },
            },
      ),
    activity: () => Promise.resolve({ kind: 'unreachable' }),
    catalogue: async (_address, _token, libraryId, after) => {
      const page = await read(libraryId, after);

      return page === null ? { kind: 'refused', code: '404' } : { kind: 'answered', answer: page };
    },
    passThrough: () => Promise.resolve(null),
  };

  return {
    sync: createCatalogueSync({ db: here, linking: films, links, peers }),
    here,
    host,
    animeAtFilms,
    anime: sharing,
  };
};

describe('createCatalogueSync', () => {
  it(
    'keeps a library here for each one shared, holding its titles as rows of this server’s own',
    async () => {
      const { sync, here, animeAtFilms } = await mirroring();

      expect(await sync.syncServer(animeAtFilms)).toEqual({
        serverId: animeAtFilms,
        libraries: 2,
        kept: 3,
        forgotten: 0,
      });

      const cinema = localIdOf(animeAtFilms, FILMS);
      const [kept] = await here
        .select()
        .from(mediaItem)
        .where(eq(mediaItem.id, localIdOf(animeAtFilms, ALIEN)));
      const [shelf] = await here.select().from(library).where(eq(library.id, cinema));

      expect(shelf).toMatchObject({ name: 'Cinema', kind: 'movies', linkedServerId: animeAtFilms });
      expect(kept).toMatchObject({
        libraryId: cinema,
        path: `linked://${animeAtFilms}/api/media/${ALIEN}`,
        posterUrl: null,
      });
      expect(sync.allowsDownloads(animeAtFilms)).toBe(true);
      expect(sync.takesRequests(animeAtFilms)).toBe(false);
      expect(sync.isReachable(animeAtFilms)).toBe(true);
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'makes a title this server already has another copy of its own, named with the server',
    async () => {
      const { sync, here, animeAtFilms } = await mirroring();

      await sync.syncServer(animeAtFilms);

      const [theirs] = await here
        .select()
        .from(mediaItem)
        .where(eq(mediaItem.id, localIdOf(animeAtFilms, ARRIVAL)));

      expect(theirs).toMatchObject({
        parentId: MY_ARRIVAL,
        versionLabel: '1080p · Anime',
        posterUrl: `linked://${animeAtFilms}/api/media/${ARRIVAL}/image/poster`,
      });
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'forgets what has gone from the other server, and a library no longer shared',
    async () => {
      const { sync, here, host, animeAtFilms, anime } = await mirroring();

      await sync.syncServer(animeAtFilms);
      await host.delete(mediaItem).where(eq(mediaItem.id, ALIEN));

      expect((await sync.syncServer(animeAtFilms))?.forgotten).toBe(1);

      anime.shared = [SHARED[0] ?? { id: FILMS, name: 'Cinema', kind: 'movies' }];

      await sync.syncServer(animeAtFilms);

      expect(
        await here
          .select()
          .from(library)
          .where(eq(library.id, localIdOf(animeAtFilms, BOOKS))),
      ).toEqual([]);
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'leaves what a server shares as it was while it cannot be reached, and says so',
    async () => {
      const { sync, here, animeAtFilms, anime } = await mirroring();

      await sync.syncServer(animeAtFilms);
      anime.isAway = true;

      expect(await sync.syncServer(animeAtFilms)).toBeNull();
      expect(sync.isReachable(animeAtFilms)).toBe(false);
      expect(
        await here.select().from(library).where(eq(library.linkedServerId, animeAtFilms)),
      ).toHaveLength(2);
      expect(await sync.syncAll()).toEqual([]);
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'reads nothing from a server it is not linked with',
    async () => {
      const { sync } = await mirroring();

      expect(await sync.syncServer('00000000-0000-4000-8000-000000000000')).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );
});
