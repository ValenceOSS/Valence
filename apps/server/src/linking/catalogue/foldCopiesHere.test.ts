import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, linkedServer, mediaItem, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { foldCopiesHere } from './foldCopiesHere';

const STARTING_THE_DATABASE_MS = 60_000;

const FILMS = '00000000-0000-4000-8000-0000000000f1';

/**
 * A database with a library of this server's own of the kind given, and one kept from Films.
 *
 * @param kind - What the libraries hold.
 * @returns The database.
 */
const twoShelves = async (kind: 'movies' | 'shows') => {
  const db = await aMigratedDatabase();

  await db.insert(linkedServer).values({
    id: FILMS,
    name: 'Films',
    colour: '#e8503a',
    address: 'https://films.example',
    publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
    fingerprint: 'abcd',
    state: 'linked',
  });
  await db.insert(library).values([
    { id: 'mine', name: 'Mine', kind, path: '/m' },
    { id: 'theirs', name: 'Theirs', kind, path: '/t', linkedServerId: FILMS },
  ]);

  return db;
};

describe('foldCopiesHere', () => {
  it(
    'makes a film held here by its catalogue or IMDb id another copy of this server’s own',
    async () => {
      const db = await twoShelves('movies');

      await db.insert(mediaItem).values([
        { ...aMediaItemRow('my-arrival', 'mine'), externalId: 'tmdb:1' },
        { ...aMediaItemRow('my-alien', 'mine'), imdbId: 'tt2' },
        { ...aMediaItemRow('their-arrival', 'theirs'), externalId: 'tmdb:1', height: 2160 },
        { ...aMediaItemRow('their-alien', 'theirs'), imdbId: 'tt2' },
        { ...aMediaItemRow('their-dune', 'theirs'), externalId: 'tmdb:3' },
      ]);

      expect(await foldCopiesHere(db, 'theirs', 'Films')).toBe(2);

      const rows = await db.select().from(mediaItem).where(eq(mediaItem.libraryId, 'theirs'));

      expect(rows.find((row) => row.id === 'their-arrival')).toMatchObject({
        parentId: 'my-arrival',
        versionLabel: '2160p · Films',
      });
      expect(rows.find((row) => row.id === 'their-alien')?.parentId).toBe('my-alien');
      expect(rows.find((row) => row.id === 'their-dune')?.parentId).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'makes an episode held here, by its programme, season and number, a copy of this one’s own',
    async () => {
      const db = await twoShelves('shows');

      await db.insert(series).values([
        { id: 'my-show', libraryId: 'mine', key: 'a', title: 'Show', externalId: 'tmdb:9' },
        { id: 'their-show', libraryId: 'theirs', key: 'b', title: 'Show', externalId: 'tmdb:9' },
      ]);
      await db.insert(mediaItem).values([
        {
          ...aMediaItemRow('mine-1', 'mine'),
          seriesId: 'my-show',
          seasonNumber: 1,
          episodeNumber: 1,
        },
        {
          ...aMediaItemRow('theirs-1', 'theirs'),
          seriesId: 'their-show',
          seasonNumber: 1,
          episodeNumber: 1,
        },
        {
          ...aMediaItemRow('theirs-2', 'theirs'),
          seriesId: 'their-show',
          seasonNumber: 1,
          episodeNumber: 2,
        },
      ]);

      expect(await foldCopiesHere(db, 'theirs', 'Films')).toBe(1);
      expect(
        (await db.select().from(mediaItem).where(eq(mediaItem.id, 'theirs-1')))[0]?.parentId,
      ).toBe('mine-1');
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'folds nothing on a shelf of music or books, or a library there is not',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values({ id: 'music', name: 'Music', kind: 'music', path: '/m' });

      expect(await foldCopiesHere(db, 'music', 'Films')).toBe(0);
      expect(await foldCopiesHere(db, 'nowhere', 'Films')).toBe(0);
    },
    STARTING_THE_DATABASE_MS,
  );
});
