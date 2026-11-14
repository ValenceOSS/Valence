import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaArtworkChoice, mediaItem } from '#dialect/Schema';
import { SUMMARY_COLUMNS } from './SUMMARY_COLUMNS';

const STARTING_POSTGRES_MS = 60_000;

/**
 * An episode of a show as the scan would store it.
 *
 * @param id - The item.
 * @param libraryId - The library it is in.
 * @param externalId - The catalogue's id for its show.
 * @returns The row.
 */
const anEpisode = (
  id: string,
  libraryId: string,
  externalId: string,
): typeof mediaItem.$inferInsert => ({
  id,
  libraryId,
  path: `/${libraryId}/${id}`,
  title: id,
  seriesTitle: externalId,
  externalId,
  backdropUrl: `https://catalogue.example/${externalId}.jpg`,
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

describe('SUMMARY_COLUMNS', { timeout: STARTING_POSTGRES_MS }, () => {
  it("gives a show's chosen backdrop to that show alone, however many shows have one", async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values([
      { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' },
      { id: 'anime', name: 'Anime', kind: 'anime', path: '/anime' },
    ]);
    await db
      .insert(mediaItem)
      .values([
        anEpisode('friends-1', 'shows', '100'),
        anEpisode('picard-1', 'shows', '200'),
        anEpisode('sao-1', 'anime', '100'),
        anEpisode('sao-2', 'anime', '300'),
      ]);
    await db.insert(mediaArtworkChoice).values([
      {
        id: 'c1',
        libraryId: 'shows',
        externalKind: 'tv',
        externalId: '100',
        kind: 'backdrop',
        url: 'https://catalogue.example/friends-chosen.jpg',
      },
      {
        id: 'c2',
        libraryId: 'anime',
        externalKind: 'tv',
        externalId: '300',
        kind: 'backdrop',
        url: 'https://catalogue.example/sao-chosen.jpg',
      },
    ]);

    const rows = await db
      .select({ id: SUMMARY_COLUMNS.id, titleBackdropUrl: SUMMARY_COLUMNS.titleBackdropUrl })
      .from(mediaItem);

    expect(rows.toSorted((one, other) => one.id.localeCompare(other.id))).toEqual([
      { id: 'friends-1', titleBackdropUrl: 'https://catalogue.example/friends-chosen.jpg' },
      { id: 'picard-1', titleBackdropUrl: null },
      { id: 'sao-1', titleBackdropUrl: null },
      { id: 'sao-2', titleBackdropUrl: 'https://catalogue.example/sao-chosen.jpg' },
    ]);
  });
});
