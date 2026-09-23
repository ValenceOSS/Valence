import { describe, expect, it } from 'vitest';
import { showIdOf } from './showIdOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * An episode of something, or a film where it is given no series.
 */
const anItem = (series: Pick<MediaSummary, 'seriesId' | 'seriesTitle'>): MediaSummary => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  title: 'Good News',
  year: 2022,
  durationSeconds: 3000,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  ...series,
});

describe('showIdOf', () => {
  it('uses the series the scanner matched', () => {
    expect(showIdOf(anItem({ seriesId: 'series-1', seriesTitle: 'Severance' }))).toBe('series-1');
  });

  it('falls back to a slug of the series title', () => {
    expect(showIdOf(anItem({ seriesId: null, seriesTitle: 'Severance' }))).not.toBeNull();
  });

  it('says nothing for a film', () => {
    expect(showIdOf(anItem({ seriesId: null, seriesTitle: null }))).toBeNull();
  });
});
