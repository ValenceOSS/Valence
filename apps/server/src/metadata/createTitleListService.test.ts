import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, linkedServer, mediaItem, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createTitleListService } from './createTitleListService';
import type { TitleListQuery } from '@ValenceContracts/schemas/TitleList';

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

const QUERY: TitleListQuery = {
  libraryId: 'lib',
  sort: 'title',
  desc: false,
  show: 'all',
  filter: [],
};

describe('createTitleListService', { timeout: STARTING_DATABASE_MS }, () => {
  it('lists each title once, in order by name without a leading article', async () => {
    const service = await aService();
    const page = await service.list(QUERY, undefined, 10);

    expect(page.titles.map((one) => [one.name, one.kind, one.files, one.seasons])).toEqual([
      ['Heat', 'film', 1, 0],
      ['The Matrix', 'film', 2, 0],
      ['Show', 'show', 2, 2],
    ]);
    expect(page.titles[1]).toMatchObject({
      id: 'matrix',
      versions: 1,
      isMatched: true,
      sizeBytes: 2000,
    });
    expect(page.total).toBe(3);
    expect(page.counts.all).toBe(3);
    expect(page.next).toBeNull();
  });

  it('pages newest first, carrying on from where the last page stopped', async () => {
    const service = await aService();
    const asked: TitleListQuery = { ...QUERY, sort: 'added', desc: true };
    const first = await service.list(asked, undefined, 2);
    const second = await service.list(asked, first.next ?? '', 2);

    expect(first.titles.map((one) => one.name)).toEqual(['Show', 'The Matrix']);
    expect(second.titles.map((one) => one.name)).toEqual(['Heat']);
    expect(second.next).toBeNull();
  });

  it('searches by name and filters by genre, counting each quick filter of what is left', async () => {
    const service = await aService();

    expect((await service.list({ ...QUERY, search: 'matr' }, undefined, 10)).titles).toHaveLength(
      1,
    );

    const crime = await service.list({ ...QUERY, filter: ['genre:Crime'] }, undefined, 10);

    expect(crime.titles.map((one) => one.name)).toEqual(['Heat']);
    expect(crime.counts).toMatchObject({ all: 1, look: 1 });
  });

  it('names every title a listing asks for, for choosing them all', async () => {
    const service = await aService();

    const keys = await service.keys({ ...QUERY, filter: ['genre:Action'] });

    expect(keys.titles.map((one) => [one.name, one.kind, one.leadId])).toEqual([
      ['The Matrix', 'film', 'matrix'],
      ['Show', 'show', 'pilot'],
    ]);
  });

  it('says what the filters can be set to, with how many titles each shows', async () => {
    const service = await aService();
    const choices = await service.choices('lib');

    expect(choices.filters.find((one) => one.kind === 'genre')?.values).toEqual([
      { value: 'Action', count: 2 },
      { value: 'Crime', count: 1 },
      { value: 'Science Fiction', count: 1 },
    ]);
  });

  it('counts the titles that need a look in each library', async () => {
    const service = await aService();

    await expect(service.problems()).resolves.toEqual({
      libraries: [{ libraryId: 'lib', titles: 3 }],
    });
  });

  it('flags a film twice only where both copies are on this server, not beside a linked server’s', async () => {
    const db = await aMigratedDatabase();

    await db.insert(linkedServer).values({
      id: 'friend',
      name: 'Friend',
      colour: 'blue',
      address: 'https://friend.example.com',
      publicKey: {},
      fingerprint: 'friend',
      state: 'linked',
    });
    await db.insert(library).values([
      { id: 'lib', name: 'Films', kind: 'movies', path: '/lib' },
      {
        id: 'theirs',
        name: 'Their films',
        kind: 'movies',
        path: 'linked://friend/api/libraries/1',
        linkedServerId: 'friend',
      },
    ]);
    await db.insert(mediaItem).values([
      { ...aMediaItemRow('matrix', 'lib'), title: 'The Matrix', externalId: '603' },
      { ...aMediaItemRow('heat', 'lib'), title: 'Heat', externalId: '949' },
      { ...aMediaItemRow('heat-again', 'lib'), title: 'Heat', externalId: '949' },
      { ...aMediaItemRow('their-matrix', 'theirs'), title: 'The Matrix', externalId: '603' },
    ]);

    const service = createTitleListService(db);
    const flagged = async (libraryId: string) =>
      (await service.list({ ...QUERY, libraryId }, undefined, 100)).titles
        .filter((title) => title.problemFiles.duplicate.length > 0)
        .map((title) => title.lead.id)
        .toSorted();

    await expect(flagged('lib')).resolves.toEqual(['heat', 'heat-again']);
    await expect(flagged('theirs')).resolves.toEqual([]);
  });

  it('reads every file of a title through any one of them, or the list’s id for a programme', async () => {
    const service = await aService();

    expect((await service.filesOf('matrix-4k'))?.files.map((one) => one.id).sort()).toEqual([
      'matrix',
      'matrix-4k',
    ]);
    expect((await service.filesOf('pilot'))?.files.map((one) => one.id).sort()).toEqual([
      'pilot',
      'second',
    ]);
    expect(Object.keys((await service.filesOf('series lib show'))?.paths ?? {}).sort()).toEqual([
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
