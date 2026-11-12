import { describe, expect, it } from 'vitest';
import { collapseToShows } from './collapseToShows';
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
