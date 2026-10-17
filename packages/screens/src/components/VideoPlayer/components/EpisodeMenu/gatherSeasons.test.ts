import { describe, expect, it } from 'vitest';
import { gatherSeasons } from './gatherSeasons';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episodeOf = (
  seasonNumber: number | null,
  episodeNumber: number | null,
  id = `${String(seasonNumber)}-${String(episodeNumber)}`,
): MediaSummary => ({
  id,
  libraryId: '00000000-0000-4000-8000-000000000000',
  title: `Episode ${String(episodeNumber)}`,
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'Some Show',
  seasonNumber,
  episodeNumber,
});

describe('gatherSeasons', () => {
  it('puts each episode in its own season', () => {
    const seasons = gatherSeasons([episodeOf(1, 1), episodeOf(2, 1), episodeOf(1, 2)]);

    expect(seasons.map((season) => season.episodes.map((episode) => episode.id))).toEqual([
      ['1-1', '1-2'],
      ['2-1'],
    ]);
  });

  it('orders episodes by number within a season, whatever order they arrived in', () => {
    const [season] = gatherSeasons([episodeOf(1, 3), episodeOf(1, 1), episodeOf(1, 2)]);

    expect(season?.episodes.map((episode) => episode.episodeNumber)).toEqual([1, 2, 3]);
  });

  it('orders numbered seasons first, then the specials, then anything unplaced', () => {
    const seasons = gatherSeasons([
      episodeOf(null, 1),
      episodeOf(0, 1),
      episodeOf(2, 1),
      episodeOf(1, 1),
    ]);

    expect(seasons.map((season) => season.seasonNumber)).toEqual([1, 2, 0, null]);
  });

  it('treats an episode with no season the same as one placed in none', () => {
    const { seasonNumber: _dropped, ...unplaced } = episodeOf(null, 2, 'unplaced');
    const seasons = gatherSeasons([episodeOf(null, 1), unplaced]);

    expect(seasons).toHaveLength(1);
    expect(seasons[0]?.episodes.map((episode) => episode.id)).toEqual(['null-1', 'unplaced']);
  });

  it('has nothing to offer for no episodes', () => {
    expect(gatherSeasons([])).toEqual([]);
  });
});
