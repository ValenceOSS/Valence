import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  ageCeiling,
  library,
  mediaItem,
  user,
  viewerProfile,
  watchProgress,
} from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { reachableByViewer } from '@ValenceServer/visibility/reachableByViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { createDatabaseStreamedFilms } from './createDatabaseStreamedFilms';
import { foldStreamedFilms } from './foldStreamedFilms';
import { streamedPathOf } from './streamedPathOf';

const CHOICE = {
  mediaItemId: 'streamed-1',
  pluginId: 'example-files',
  sourceId: 'files',
  streamKey: 'a',
  name: 'Film.1999.1080p',
  infoHash: null,
  fileName: 'film.mkv',
  sizeBytes: 1000,
};

/**
 * A migrated database holding one library of the server's own, and a film played from a source.
 *
 * @returns The database and the store.
 */
const aScratchDatabase = async () => {
  const db = await aMigratedDatabase();
  const films = createDatabaseStreamedFilms(db);

  await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
  await db
    .insert(mediaItem)
    .values([
      aMediaItemRow('owned', 'films'),
      { ...aMediaItemRow('streamed-1', await films.libraryId()), path: streamedPathOf(603) },
    ]);

  return { db, films };
};

describe('where films played from a source are kept', () => {
  it('makes one hidden library, once, however often it is asked for', async () => {
    const { db, films } = await aScratchDatabase();
    const [first, second] = await Promise.all([films.libraryId(), films.libraryId()]);

    expect(first).toBe(second);
    expect(
      await db.select({ id: library.id }).from(library).where(eq(library.isStreamed, true)),
    ).toEqual([{ id: first }]);
  });

  it('finds a film’s title by its id in the catalogue, and reads its path back', async () => {
    const { films } = await aScratchDatabase();

    expect(await films.itemOf(603)).toBe('streamed-1');
    expect(await films.itemOf(604)).toBeNull();
    expect(await films.itemsOf([603, 604])).toEqual(new Map([[603, 'streamed-1']]));
    expect(await films.pathOf('streamed-1')).toBe('streamed://film/603');
  });

  it('keeps the stream last chosen for a film, replacing the one before', async () => {
    const { films } = await aScratchDatabase();

    expect(await films.choiceOf('streamed-1')).toBeNull();

    await films.choose(CHOICE);
    await films.choose({ ...CHOICE, streamKey: 'b' });

    expect(await films.choiceOf('streamed-1')).toEqual({ ...CHOICE, streamKey: 'b' });
  });

  it('lands two choices made at once without either failing', async () => {
    const { films } = await aScratchDatabase();

    await Promise.all([
      films.choose({ ...CHOICE, streamKey: 'a' }),
      films.choose({ ...CHOICE, streamKey: 'b' }),
    ]);

    expect((await films.choiceOf('streamed-1'))?.streamKey).toMatch(/^[ab]$/);
  });

  it('is offered to nobody, the server included, unless somebody’s own viewing asks', async () => {
    const { db } = await aScratchDatabase();
    const offered = await db
      .select({ id: library.id })
      .from(library)
      .where(librariesVisibleToViewer(db, asTheServer));
    const listed = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(visibleToViewer(db, asTheServer));
    const viewed = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(visibleToViewer(db, asTheServer, { includesStreamed: true }));

    expect(offered).toEqual([{ id: 'films' }]);
    expect(listed).toEqual([{ id: 'owned' }]);
    expect(viewed.map((row) => row.id).toSorted()).toEqual(['owned', 'streamed-1']);
  });

  it('holds a film played from a source to the strictest ceiling the account has on any library', async () => {
    const { db } = await aScratchDatabase();
    const kid = {
      kind: 'account',
      accountId: 'kid',
      profileId: null,
      isAdministrator: false,
    } as const;
    const reachable = async () =>
      (await db.select({ id: mediaItem.id }).from(mediaItem).where(reachableByViewer(db, kid))).map(
        (row) => row.id,
      );

    await db.insert(user).values({ id: 'kid', name: 'Kid', email: 'kid@example.com' });
    await db.update(mediaItem).set({ certificationAge: 15 });

    expect((await reachable()).toSorted()).toEqual(['owned', 'streamed-1']);

    await db.insert(ageCeiling).values({ userId: 'kid', libraryId: 'films', maximumAge: 12 });

    expect(await reachable()).toEqual([]);
  });

  it('hands a streamed film’s viewing to the same film once it arrives in a library, and forgets the copy', async () => {
    const { db } = await aScratchDatabase();

    await db.update(mediaItem).set({ externalId: '603' });
    await db.insert(user).values({ id: 'u', name: 'U', email: 'u@example.com' });
    await db.insert(viewerProfile).values({ id: 'p', userId: 'u', name: 'U', colour: 'red' });
    await db.insert(watchProgress).values({
      id: 'w',
      profileId: 'p',
      mediaItemId: 'streamed-1',
      positionSeconds: 600,
      durationSeconds: 5400,
    });

    expect(await foldStreamedFilms(db, ['owned'])).toBe(1);
    expect(await db.select({ mediaItemId: watchProgress.mediaItemId }).from(watchProgress)).toEqual(
      [{ mediaItemId: 'owned' }],
    );
    expect((await db.select({ id: mediaItem.id }).from(mediaItem)).map((row) => row.id)).toEqual([
      'owned',
    ]);
    expect(await foldStreamedFilms(db, ['owned'])).toBe(0);
  });
});
