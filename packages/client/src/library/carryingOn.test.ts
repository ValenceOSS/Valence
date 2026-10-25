import { describe, expect, it } from 'vitest';
import { carryingOn } from './carryingOn';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const itemOf = (id: string): MediaSummary => ({
  id,
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: id,
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
});

const progressAt = (entries: [string, string][]): Map<string, WatchProgress> =>
  new Map(
    entries.map(([mediaId, updatedAt]) => [
      mediaId,
      { mediaId, positionSeconds: 600, durationSeconds: 1500, isFinished: false, updatedAt },
    ]),
  );

describe('carryingOn', () => {
  it('weaves the next episodes in among what was stopped part way, most recent first', () => {
    const found = carryingOn(
      [itemOf('film'), itemOf('older film')],
      progressAt([
        ['film', '2026-10-03T00:00:00.000Z'],
        ['older film', '2026-10-01T00:00:00.000Z'],
      ]),
      [{ episode: itemOf('next episode'), lastWatchedAt: '2026-10-02T00:00:00.000Z' }],
    );

    expect(found.map((one) => one.id)).toEqual(['film', 'next episode', 'older film']);
  });

  it('offers something only once, where it is both half watched and next', () => {
    const found = carryingOn(
      [itemOf('episode')],
      progressAt([['episode', '2026-10-01T00:00:00.000Z']]),
      [{ episode: itemOf('episode'), lastWatchedAt: '2026-10-02T00:00:00.000Z' }],
    );

    expect(found.map((one) => one.id)).toEqual(['episode']);
  });

  it('puts anything with no time it was watched last', () => {
    const found = carryingOn([itemOf('unknown')], new Map(), [
      { episode: itemOf('next episode'), lastWatchedAt: '2026-10-02T00:00:00.000Z' },
    ]);

    expect(found.map((one) => one.id)).toEqual(['next episode', 'unknown']);
  });

  it('leaves out what was taken off the row, even where a list read before still holds it', () => {
    const progress = progressAt([
      ['film', '2026-10-03T00:00:00.000Z'],
      ['taken off', '2026-10-02T00:00:00.000Z'],
    ]);
    const taken = progress.get('taken off');

    if (taken !== undefined) {
      progress.set('taken off', { ...taken, isDismissed: true });
    }

    const found = carryingOn([itemOf('film'), itemOf('taken off')], progress, []);

    expect(found.map((one) => one.id)).toEqual(['film']);
  });

  it('has nothing to offer where nothing is under way', () => {
    expect(carryingOn([], new Map(), [])).toEqual([]);
  });
});
