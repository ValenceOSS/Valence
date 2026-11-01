import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, series } from '#dialect/Schema';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { readSummaries } from './readSummaries';

const STARTING_POSTGRES_MS = 60_000;

/**
 * An item as the scan would store it.
 *
 * @param id - The item.
 * @param libraryId - The library it is in.
 * @returns The row.
 */
const anItem = (id: string, libraryId: string): typeof mediaItem.$inferInsert => ({
  id,
  libraryId,
  path: `/${libraryId}/${id}`,
  title: id,
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 60,
  videoCodec: 'h264',
  videoRange: 'sdr',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
});

describe('readSummaries', { timeout: STARTING_POSTGRES_MS }, () => {
  it('reads cards by the id asked, leaving out versions, extras, the unknown and the locked', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values([
      { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
      { id: 'locked', name: 'Locked', kind: 'movies', path: '/locked' },
    ]);
    await db
      .insert(mediaItem)
      .values([
        anItem('arrival', 'films'),
        anItem('dune', 'films'),
        { ...anItem('arrival-4k', 'films'), parentId: 'arrival' },
        { ...anItem('arrival-trailer', 'films'), extraKind: 'trailer' },
        anItem('secret', 'locked'),
      ]);

    const grown: Viewer = {
      kind: 'account',
      accountId: 'adult',
      profileId: 'grown',
      isAdministrator: false,
      lockedLibraries: ['locked'],
    };
    const asked = ['dune', 'nothing', 'arrival-4k', 'arrival-trailer', 'secret', 'arrival', 'dune'];

    expect([...(await readSummaries(db, grown, asked)).keys()].sort()).toEqual(['arrival', 'dune']);
    expect([...(await readSummaries(db, asTheServer, asked)).keys()].sort()).toEqual([
      'arrival',
      'dune',
      'secret',
    ]);
    expect((await readSummaries(db, grown, [])).size).toBe(0);
  });

  it('draws a show named by id with its first episode the viewer may see', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' });
    await db
      .insert(series)
      .values({ id: 'frieren', libraryId: 'shows', key: 'frieren', title: 'Frieren' });
    await db.insert(mediaItem).values([
      { ...anItem('second', 'shows'), seriesId: 'frieren', seasonNumber: 1, episodeNumber: 2 },
      { ...anItem('first', 'shows'), seriesId: 'frieren', seasonNumber: 1, episodeNumber: 1 },
    ]);

    const cards = await readSummaries(db, asTheServer, ['frieren', 'second']);

    expect(cards.get('frieren')).toMatchObject({ id: 'first', seriesId: 'frieren' });
    expect(cards.get('second')).toMatchObject({ id: 'second', seriesId: 'frieren' });
  });
});
