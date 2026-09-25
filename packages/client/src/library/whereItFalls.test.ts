import { describe, expect, it } from 'vitest';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { whereItFalls } from './whereItFalls';

const anEpisode = (numbers: { seasonNumber?: number; episodeNumber?: number }) =>
  MediaSummarySchema.parse({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'Good News About Hell',
    year: 2022,
    durationSeconds: 3300,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    seriesId: 'severance',
    seriesTitle: 'Severance',
    ...numbers,
  });

describe('whereItFalls', () => {
  it('gives the season and number before the episode’s own title', () => {
    expect(whereItFalls(anEpisode({ seasonNumber: 1, episodeNumber: 2 }))).toBe(
      'S1 · E2  Good News About Hell',
    );
  });

  it('gives only the title where the numbers are not known', () => {
    expect(whereItFalls(anEpisode({ seasonNumber: 1 }))).toBe('Good News About Hell');
  });
});
