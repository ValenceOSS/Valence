import { describe, expect, it } from 'vitest';
import { firstEpisodeOf } from './firstEpisodeOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

const episode = (seasonNumber: number, episodeNumber: number): MediaSummary => ({
  id: `${seasonNumber.toString()}-${episodeNumber.toString()}`,
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: `Episode ${episodeNumber.toString()}`,
  year: 2024,
  durationSeconds: 1400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'A Sign of Affection',
  seasonNumber,
  episodeNumber,
});

const show = (seasons: { seasonNumber: number; episodes: number[] }[]): ShowDetail => ({
  id: 'a-sign-of-affection',
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: 'A Sign of Affection',
  seasonCount: seasons.length,
  episodeCount: seasons.reduce((count, season) => count + season.episodes.length, 0),
  latestAddedAt: '2026-08-10T00:00:00.000Z',
  coverMediaId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  seriesId: null,
  year: 2024,
  rating: 8.1,
  genres: [],
  seasons: seasons.map((season) => ({
    seasonNumber: season.seasonNumber,
    episodes: season.episodes.map((number) => episode(season.seasonNumber, number)),
  })),
});

describe('firstEpisodeOf', () => {
  it('is the first episode of the first season', () => {
    expect(
      firstEpisodeOf(
        show([
          { seasonNumber: 1, episodes: [1, 2] },
          { seasonNumber: 2, episodes: [1] },
        ]),
      )?.id,
    ).toBe('1-1');
  });

  it('leaves the specials aside, wherever a server lists them', () => {
    expect(
      firstEpisodeOf(
        show([
          { seasonNumber: 0, episodes: [1] },
          { seasonNumber: 1, episodes: [1] },
        ]),
      )?.id,
    ).toBe('1-1');
    expect(
      firstEpisodeOf(
        show([
          { seasonNumber: 3, episodes: [2] },
          { seasonNumber: 2, episodes: [5] },
        ]),
      )?.id,
    ).toBe('2-5');
  });

  it('falls back to a special where there is nothing else', () => {
    expect(firstEpisodeOf(show([{ seasonNumber: 0, episodes: [4] }]))?.id).toBe('0-4');
  });

  it('is nothing for a programme with no episodes', () => {
    expect(firstEpisodeOf(show([]))).toBeNull();
  });
});
