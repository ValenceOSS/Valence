import { describe, expect, it, vi } from 'vitest';
import { hidden, library, mediaItem, rating, series, watchHistory } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createDatabaseLikenessStore } from './createDatabaseLikenessStore';
import { WATCHED_ENOUGH_SECONDS, createLikenessService } from './createLikenessService';
import type { Likeness, TitleKind } from './Likeness';

const STARTING_POSTGRES_MS = 60_000;

const READ_AT = new Date('2026-10-01T00:00:00.000Z');

const DRAMA: Likeness = { genres: [18], keywords: [], cast: [], crew: [], recommendations: [] };

/**
 * Fills a household with films and a programme that are all dramas, and keeps what each is like.
 *
 * @param films - The catalogue identifiers of the films, each also its id and title.
 * @returns The household, and the service over it.
 */
const aDramaticHousehold = async (films: readonly string[]) => {
  const household = await aHousehold();
  const { db } = household;
  const store = createDatabaseLikenessStore(db);

  await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' });
  await db
    .insert(series)
    .values({ id: 'severance', libraryId: 'shows', key: 'severance', title: 'Severance' });
  await db.insert(mediaItem).values([
    ...films.map((id) => ({ ...aMediaItemRow(id, 'films'), externalId: id })),
    ...[
      ['s0e1', 0, 1],
      ['s2e1', 2, 1],
      ['s1e2', 1, 2],
      ['s1e1', 1, 1],
    ].map(([id, season, episode]) => ({
      ...aMediaItemRow(String(id), 'shows'),
      seriesId: 'severance',
      seriesTitle: 'Severance',
      seasonNumber: Number(season),
      episodeNumber: Number(episode),
      externalId: '95396',
    })),
  ]);

  const kept: { kind: TitleKind; catalogueId: string }[] = [
    ...films.map((catalogueId) => ({ kind: 'film' as const, catalogueId })),
    { kind: 'series', catalogueId: '95396' },
  ];

  for (const title of kept) {
    await store.keep(title, DRAMA, READ_AT);
  }

  return { ...household, store, service: createLikenessService({ db, store }) };
};

describe('createLikenessService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds the titles like one that the viewer may see, a programme by its first episode and not a special', async () => {
    const { db, viewer, service } = await aDramaticHousehold(['1', '2', '3']);

    await db.insert(hidden).values({ id: 'hid', profileId: 'pat', mediaItemId: '3' });

    const found = await service.likeThis(viewer, '1', 10);

    expect(found?.map((one) => one.id).toSorted()).toEqual(['2', 's1e1']);
  });

  it('finds nothing like a title the catalogue never named, and says so for one not there', async () => {
    const { viewer, service } = await aDramaticHousehold(['1', '2']);

    await expect(service.likeThis(viewer, 'film', 10)).resolves.toEqual([]);
    await expect(service.likeThis(viewer, 'nowhere', 10)).resolves.toBeNull();
  });

  it('takes no more than it is asked for', async () => {
    const { viewer, service } = await aDramaticHousehold(['1', '2', '3', '4']);

    await expect(service.likeThis(viewer, '1', 2)).resolves.toHaveLength(2);
  });

  it('reads what titles are like once until told to forget', async () => {
    const { db, viewer } = await aDramaticHousehold(['1', '2']);
    const store = createDatabaseLikenessStore(db);
    const readAll = vi.fn(() => store.readAll());
    const service = createLikenessService({ db, store: { readAll } });

    await service.likeThis(viewer, '1', 10);
    await service.likeThis(viewer, '1', 10);
    service.forget();
    await service.likeThis(viewer, '1', 10);

    expect(readAll).toHaveBeenCalledTimes(2);
  });

  it('suggests a row for each title the profile watched lately, leaving out what it has seen', async () => {
    const { db, viewer, service } = await aDramaticHousehold(['1', '2', '3', '4', '5', '6']);

    await db.insert(watchHistory).values([
      {
        id: 'watched',
        profileId: 'pat',
        mediaItemId: '1',
        isFinished: true,
        lastWatchedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'begun',
        profileId: 'pat',
        mediaItemId: '2',
        secondsWatched: 60,
        lastWatchedAt: new Date('2026-10-21T00:00:00.000Z'),
      },
    ]);

    const rows = await service.becauseYouWatched(viewer, 3, 10);

    expect(rows.map((row) => row.watched)).toEqual([{ title: '1', mediaId: '1', seriesId: null }]);
    expect(rows[0]?.items.map((one) => one.id).toSorted()).toEqual(['3', '4', '5', '6', 's1e1']);
  });

  it('names a programme watched by the programme, and offers no title in two rows', async () => {
    const { db, viewer, service } = await aDramaticHousehold(['1', '2', '3', '4', '5']);

    await db.insert(watchHistory).values([
      {
        id: 'episode',
        profileId: 'pat',
        mediaItemId: 's1e2',
        secondsWatched: WATCHED_ENOUGH_SECONDS,
        lastWatchedAt: new Date('2026-10-21T00:00:00.000Z'),
      },
      {
        id: 'film',
        profileId: 'pat',
        mediaItemId: '1',
        isFinished: true,
        lastWatchedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
    ]);

    const rows = await service.becauseYouWatched(viewer, 3, 10);

    expect(rows.map((row) => row.watched)).toEqual([
      { title: 'Severance', mediaId: 's1e2', seriesId: 'severance' },
    ]);
    expect(rows[0]?.items.map((one) => one.id).toSorted()).toEqual(['2', '3', '4', '5']);
  });

  it('counts watching a film’s trailer as watching neither the film nor anything', async () => {
    const { db, viewer, service } = await aDramaticHousehold(['1', '2', '3', '4', '5']);

    await db.insert(mediaItem).values({
      ...aMediaItemRow('trailer', 'films'),
      externalId: '1',
      extraKind: 'trailer',
    });
    await db.insert(watchHistory).values({
      id: 'trailer',
      profileId: 'pat',
      mediaItemId: 'trailer',
      isFinished: true,
    });

    await expect(service.becauseYouWatched(viewer, 3, 10)).resolves.toEqual([]);
  });

  it('suggests nothing from a title the profile rated poorly', async () => {
    const { db, viewer, service } = await aDramaticHousehold(['1', '2', '3', '4', '5', '6']);

    await db.insert(watchHistory).values({
      id: 'watched',
      profileId: 'pat',
      mediaItemId: '1',
      isFinished: true,
    });
    await db.insert(rating).values({ id: 'meh', profileId: 'pat', mediaItemId: '1', stars: 2 });

    await expect(service.becauseYouWatched(viewer, 3, 10)).resolves.toEqual([]);
  });

  it('suggests nothing to a viewer who is not a profile', async () => {
    const { service } = await aDramaticHousehold(['1', '2']);

    await expect(service.becauseYouWatched({ kind: 'server' }, 3, 10)).resolves.toEqual([]);
  });
});
