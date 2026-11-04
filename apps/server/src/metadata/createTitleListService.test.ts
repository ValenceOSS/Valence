import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createTitleListService } from './createTitleListService';

const STARTING_DATABASE_MS = 60_000;

/**
 * A service over a library holding two films, one in two versions, and a programme of two
 * episodes, beside a streamed library nobody edits.
 *
 * @returns The service.
 */
const aService = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values([
    { id: 'lib', name: 'Everything', kind: 'movies', path: '/lib' },
    { id: 'away', name: 'Streamed', kind: 'movies', path: '/away', isStreamed: true },
  ]);
  await db
    .insert(series)
    .values({ id: 'show', libraryId: 'lib', key: 'folder:Show', title: 'Show' });
  await db.insert(mediaItem).values([
    {
      ...aMediaItemRow('matrix', 'lib'),
      title: 'The Matrix',
      externalId: '603',
      genres: ['Action', 'Science Fiction'],
      addedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      ...aMediaItemRow('matrix-4k', 'lib'),
      title: 'The Matrix',
      parentId: 'matrix',
      genres: ['Action', 'Science Fiction'],
      addedAt: new Date('2026-03-01T00:00:00.000Z'),
    },
    {
      ...aMediaItemRow('heat', 'lib'),
      title: 'Heat',
      genres: ['Crime'],
      addedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
    {
      ...aMediaItemRow('pilot', 'lib'),
      title: 'Pilot',
      seriesId: 'show',
      seriesTitle: 'Show',
      seasonNumber: 1,
      episodeNumber: 1,
      genres: ['Action'],
      addedAt: new Date('2026-04-01T00:00:00.000Z'),
    },
    {
      ...aMediaItemRow('second', 'lib'),
      title: 'Second',
      seriesId: 'show',
      seriesTitle: 'Show',
      seasonNumber: 2,
      episodeNumber: 1,
      genres: ['Action'],
      addedAt: new Date('2026-05-01T00:00:00.000Z'),
    },
    { ...aMediaItemRow('elsewhere', 'away'), title: 'Elsewhere' },
  ]);

  return createTitleListService(db);
};

describe('createTitleListService', { timeout: STARTING_DATABASE_MS }, () => {
  it('lists each title once, in order by name without a leading article', async () => {
    const service = await aService();
    const page = await service.list({ sort: 'title', limit: 10 });

    expect(page.titles.map((one) => [one.title, one.kind, one.files, one.seasons])).toEqual([
      ['Heat', 'film', 1, 0],
      ['The Matrix', 'film', 2, 0],
      ['Show', 'show', 2, 2],
    ]);
    expect(page.titles[1]).toMatchObject({ leadId: 'matrix', isMatched: true, sizeBytes: 2000 });
    expect(page.next).toBeNull();
  });

  it('pages newest first, carrying on from where the last page stopped', async () => {
    const service = await aService();
    const first = await service.list({ sort: 'added', limit: 2 });
    const second = await service.list({ sort: 'added', limit: 2, after: first.next ?? '' });

    expect(first.titles.map((one) => one.title)).toEqual(['Show', 'The Matrix']);
    expect(second.titles.map((one) => one.title)).toEqual(['Heat']);
    expect(second.next).toBeNull();
  });

  it('searches by name', async () => {
    const service = await aService();

    expect((await service.list({ sort: 'title', limit: 10, search: 'matr' })).titles).toHaveLength(
      1,
    );
  });

  it('reads every file of a title through any one of them', async () => {
    const service = await aService();

    expect((await service.filesOf('matrix-4k'))?.map((one) => one.id).sort()).toEqual([
      'matrix',
      'matrix-4k',
    ]);
    expect((await service.filesOf('pilot'))?.map((one) => one.id).sort()).toEqual([
      'pilot',
      'second',
    ]);
    await expect(service.filesOf('nothing')).resolves.toBeNull();
  });

  it('counts each word in use once a title, most used first', async () => {
    const service = await aService();

    await expect(service.values('genres', 'lib')).resolves.toEqual({
      values: [
        { value: 'Action', count: 2 },
        { value: 'Crime', count: 1 },
        { value: 'Science Fiction', count: 1 },
      ],
    });
  });
});
