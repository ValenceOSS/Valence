import { describe, expect, it } from 'vitest';
import { byLastWatched } from './byLastWatched';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const aTitle = (id: string): MediaSummary => ({
  id,
  libraryId: 'library',
  title: id,
  year: null,
  durationSeconds: 6000,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
});

const watched = (mediaId: string, updatedAt: string): WatchProgress => ({
  mediaId,
  positionSeconds: 600,
  durationSeconds: 6000,
  isFinished: false,
  updatedAt,
});

describe('byLastWatched', () => {
  it('puts what was on most recently first', () => {
    const progress = new Map([
      ['old', watched('old', '2026-09-01T00:00:00.000Z')],
      ['new', watched('new', '2026-09-20T00:00:00.000Z')],
    ]);

    expect(
      [aTitle('old'), aTitle('new')].sort(byLastWatched(progress)).map((media) => media.id),
    ).toEqual(['new', 'old']);
  });

  it('puts what nobody has watched last', () => {
    const progress = new Map([['seen', watched('seen', '2026-09-01T00:00:00.000Z')]]);

    expect(
      [aTitle('unseen'), aTitle('seen')].sort(byLastWatched(progress)).map((media) => media.id),
    ).toEqual(['seen', 'unseen']);
  });

  it('treats a time it cannot read as never', () => {
    const progress = new Map([
      ['broken', watched('broken', 'not a time')],
      ['fine', watched('fine', '2026-09-01T00:00:00.000Z')],
    ]);

    expect(
      [aTitle('broken'), aTitle('fine')].sort(byLastWatched(progress)).map((media) => media.id),
    ).toEqual(['fine', 'broken']);
  });
});
