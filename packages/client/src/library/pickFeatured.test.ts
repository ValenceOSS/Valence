import { describe, expect, it } from 'vitest';
import { collapseToShows, pickFeatured, isEarlier } from './pickFeatured';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

let counter = 0;

const STAYS_PUT = (): number => 0.999;

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

describe('pickFeatured', () => {
  it('lets a film stand for itself', () => {
    const film = itemOf({ title: 'Parasite' });

    expect(pickFeatured([film], 10)).toEqual([film]);
  });

  it('shows a series once rather than once per episode', () => {
    const featured = pickFeatured(
      [episodeOf('Show', 1, 1), episodeOf('Show', 1, 2), episodeOf('Show', 1, 3)],
      10,
    );

    expect(featured).toHaveLength(1);
  });

  it('introduces a series at its first episode', () => {
    const first = episodeOf('Show', 1, 1);
    const featured = pickFeatured([episodeOf('Show', 1, 9), first, episodeOf('Show', 2, 1)], 10);

    expect(featured).toEqual([first]);
  });

  it('keeps a show where its first file appeared, not where its first episode did', () => {
    const film = itemOf({ title: 'Parasite' });
    const featured = pickFeatured(
      [episodeOf('Show', 1, 9), film, episodeOf('Show', 1, 1)],
      10,
      STAYS_PUT,
    );

    expect(featured.map((item) => item.seriesTitle ?? item.title)).toEqual(['Show', 'Parasite']);
  });

  it('shuffles what it features, so the front page is not the same few every visit', () => {
    const first = itemOf({ title: 'First' });
    const second = itemOf({ title: 'Second' });
    const third = itemOf({ title: 'Third' });

    expect(pickFeatured([first, second, third], 3, () => 0).map((item) => item.title)).toEqual([
      'Second',
      'Third',
      'First',
    ]);
  });

  it('leaves the order alone where the draw says to', () => {
    const first = itemOf({ title: 'First' });
    const second = itemOf({ title: 'Second' });
    const third = itemOf({ title: 'Third' });

    expect(pickFeatured([first, second, third], 3, STAYS_PUT).map((item) => item.title)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
  });

  it('shuffles before it stops, so the few it keeps are drawn from everything', () => {
    const items = [itemOf({ title: 'A' }), itemOf({ title: 'B' }), itemOf({ title: 'C' })];

    expect(pickFeatured(items, 1, () => 0).map((item) => item.title)).toEqual(['B']);
  });

  it('does not change what it was given', () => {
    const items = [itemOf({ title: 'A' }), itemOf({ title: 'B' }), itemOf({ title: 'C' })];
    const before = items.map((item) => item.id);

    pickFeatured(items, 3, () => 0);

    expect(items.map((item) => item.id)).toEqual(before);
  });

  it('keeps two different shows apart', () => {
    const featured = pickFeatured([episodeOf('One', 1, 1), episodeOf('Two', 1, 1)], 10);

    expect(featured).toHaveLength(2);
  });

  it('stops at the number asked for', () => {
    expect(pickFeatured([itemOf(), itemOf(), itemOf()], 2)).toHaveLength(2);
  });

  it('has nothing to feature from nothing', () => {
    expect(pickFeatured([], 5)).toEqual([]);
  });

  it('replaces a series already standing when an earlier episode turns up', () => {
    const featured = pickFeatured([episodeOf('Ted Lasso', 1, 5), episodeOf('Ted Lasso', 1, 1)], 5);

    expect(featured.map((one) => one.episodeNumber)).toEqual([1]);
  });
});

describe('collapseToShows', () => {
  it('draws a programme once however many episodes it has', () => {
    const items = Array.from({ length: 12 }, (_unused, at) => episodeOf('The Office', 1, at + 1));

    expect(collapseToShows(items)).toHaveLength(1);
  });

  it('stands the earliest episode in for the programme', () => {
    const items = [episodeOf('The Office', 2, 4), episodeOf('The Office', 1, 3)];

    expect(collapseToShows(items)[0]).toMatchObject({ seasonNumber: 1, episodeNumber: 3 });
  });

  it('leaves films alone, since there is nothing to group them under', () => {
    const items = [itemOf({ title: 'Heat' }), itemOf({ title: 'Arrival' })];

    expect(collapseToShows(items).map((one) => one.title)).toEqual(['Heat', 'Arrival']);
  });

  it('keeps the order things arrived in', () => {
    const items = [
      itemOf({ title: 'Heat' }),
      episodeOf('The Office', 1, 1),
      itemOf({ title: 'Arrival' }),
    ];

    expect(collapseToShows(items).map((one) => one.title)).toEqual([
      'Heat',
      'The Office S1E1',
      'Arrival',
    ]);
  });

  it('does not merge two programmes that share a title', () => {
    const items = [
      itemOf({ title: 'Pilot', seriesTitle: 'The Office', seriesId: 'uk', episodeNumber: 1 }),
      itemOf({ title: 'Pilot', seriesTitle: 'The Office', seriesId: 'us', episodeNumber: 1 }),
    ];

    expect(collapseToShows(items)).toHaveLength(2);
  });

  it('still groups a programme whose episodes carry no series id', () => {
    const items = [episodeOf('Poirot', 1, 1), episodeOf('Poirot', 1, 2)];

    expect(collapseToShows(items)).toHaveLength(1);
  });

  it('has nothing to collapse in an empty library', () => {
    expect(collapseToShows([])).toEqual([]);
  });
});
