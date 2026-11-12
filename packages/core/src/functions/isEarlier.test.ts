import { describe, expect, it } from 'vitest';
import { isEarlier } from './isEarlier';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

let counter = 0;

const itemOf = (changes: Partial<MediaSummary> = {}): MediaSummary => {
  counter += 1;

  return {
    id: `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`,
    libraryId: '00000000-0000-4000-8000-000000000000',
    title: 'Something',
    year: 2020,
    durationSeconds: 3600,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    videoRange: 'sdr',
    addedAt: '2026-01-01T00:00:00.000Z',
    hasPoster: false,
    hasBackdrop: false,
    hasLogo: false,
    seriesId: null,
    ...changes,
  };
};

const episodeOf = (series: string, season: number, episode: number): MediaSummary =>
  itemOf({
    title: `${series} S${season.toString()}E${episode.toString()}`,
    seriesTitle: series,
    seasonNumber: season,
    episodeNumber: episode,
  });

describe('isEarlier', () => {
  it('puts an earlier season first', () => {
    expect(isEarlier(episodeOf('Show', 1, 9), episodeOf('Show', 2, 1))).toBe(true);
  });

  it('puts an earlier episode of the same season first', () => {
    expect(isEarlier(episodeOf('Show', 1, 1), episodeOf('Show', 1, 2))).toBe(true);
  });

  it('does not call a later episode earlier', () => {
    expect(isEarlier(episodeOf('Show', 2, 1), episodeOf('Show', 1, 9))).toBe(false);
  });
});
