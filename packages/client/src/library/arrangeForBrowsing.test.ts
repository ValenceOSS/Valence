import { describe, expect, it } from 'vitest';
import { arrangeForBrowsing } from './arrangeForBrowsing';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const aFilm = (over: Partial<MediaSummary>): MediaSummary => ({
  id: over.title ?? 'film',
  libraryId: 'films',
  title: 'Film',
  year: null,
  durationSeconds: 6000,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  ...over,
});

const ARRIVAL = aFilm({
  title: 'Arrival',
  year: 2016,
  releaseDate: '2016-11-11',
  addedAt: '2026-03-01T00:00:00.000Z',
  rating: 7.9,
  sizeBytes: 9_000,
});
const HEAT = aFilm({
  title: 'Heat',
  year: 1995,
  addedAt: '2026-05-01T00:00:00.000Z',
  rating: 8.3,
  sizeBytes: 20_000,
});
const DUNE = aFilm({
  title: 'Dune',
  year: 2021,
  releaseDate: '2021-10-22',
  addedAt: '2026-04-01T00:00:00.000Z',
  rating: null,
  sizeBytes: null,
});

const titles = (items: MediaSummary[]) => items.map((item) => item.title);
const arranged = (order: Parameters<typeof arrangeForBrowsing>[1]['order']) =>
  titles(
    arrangeForBrowsing([ARRIVAL, HEAT, DUNE], {
      order,
      isHidingWatched: false,
      isWatched: () => false,
    }),
  );

describe('arrangeForBrowsing', () => {
  it('puts what was added most recently first', () => {
    expect(arranged('added')).toEqual(['Heat', 'Dune', 'Arrival']);
  });

  it('puts the newest release first, reading a year alone as its first day', () => {
    expect(arranged('released')).toEqual(['Dune', 'Arrival', 'Heat']);
  });

  it('runs titles from A to Z', () => {
    expect(arranged('title')).toEqual(['Arrival', 'Dune', 'Heat']);
  });

  it('puts the best rated and the largest first, and anything unknown last', () => {
    expect(arranged('rating')).toEqual(['Heat', 'Arrival', 'Dune']);
    expect(arranged('size')).toEqual(['Heat', 'Arrival', 'Dune']);
  });

  it('leaves out what has been watched only where asked to', () => {
    const isWatched = (item: MediaSummary) => item.title === 'Heat';

    expect(
      titles(
        arrangeForBrowsing([ARRIVAL, HEAT], { order: 'title', isHidingWatched: true, isWatched }),
      ),
    ).toEqual(['Arrival']);
    expect(
      titles(
        arrangeForBrowsing([ARRIVAL, HEAT], { order: 'title', isHidingWatched: false, isWatched }),
      ),
    ).toEqual(['Arrival', 'Heat']);
  });

  it('leaves the list it was handed as it was', () => {
    const handed = [HEAT, ARRIVAL];

    arrangeForBrowsing(handed, { order: 'title', isHidingWatched: false, isWatched: () => false });

    expect(titles(handed)).toEqual(['Heat', 'Arrival']);
  });
});
