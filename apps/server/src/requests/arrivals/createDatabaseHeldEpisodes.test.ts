import { describe, expect, it } from 'vitest';
import { mediaItem, series } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseHeldEpisodes } from './createDatabaseHeldEpisodes';

const STARTING_POSTGRES_MS = 60_000;

const EPISODE = {
  libraryId: 'films',
  seriesId: 'show',
  title: 'An Episode',
  sizeBytes: 1,
  modifiedAtMs: 0,
  container: 'mkv',
  durationSeconds: 1800,
  videoCodec: 'h264',
  videoRange: 'sdr',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
};

describe('createDatabaseHeldEpisodes', { timeout: STARTING_POSTGRES_MS }, () => {
  it('lists each episode held of a series, a double episode as both', async () => {
    const { db } = await aHousehold();

    await db.insert(series).values([
      { id: 'show', libraryId: 'films', key: 'show', title: 'Show', externalId: '95396' },
      { id: 'other', libraryId: 'films', key: 'other', title: 'Other', externalId: '1' },
    ]);
    await db.insert(mediaItem).values([
      { ...EPISODE, id: 'e1', path: '/s1e1', seasonNumber: 1, episodeNumber: 1 },
      {
        ...EPISODE,
        id: 'e2',
        path: '/s1e2',
        seasonNumber: 1,
        episodeNumber: 2,
        episodeNumberEnd: 3,
      },
      { ...EPISODE, id: 'e9', path: '/sp', seasonNumber: null, episodeNumber: null },
      { ...EPISODE, id: 'o1', path: '/o1', seriesId: 'other', seasonNumber: 1, episodeNumber: 1 },
    ]);

    const held = await createDatabaseHeldEpisodes(db)('95396');

    expect(
      held.toSorted((left, right) => left.season - right.season || left.episode - right.episode),
    ).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
      { season: 1, episode: 3 },
    ]);
  });
});
