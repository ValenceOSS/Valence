import { describe, expect, it } from 'vitest';
import { findSiblings } from './findSiblings';
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

describe('findSiblings', () => {
  it('finds the rest of the season', () => {
    const open = episodeOf('Show', 1, 2);
    const siblings = findSiblings([episodeOf('Show', 1, 1), open, episodeOf('Show', 1, 3)], open);

    expect(siblings).toHaveLength(2);
  });

  it('leaves out the episode being read about', () => {
    const open = episodeOf('Show', 1, 2);
    const siblings = findSiblings([episodeOf('Show', 1, 1), open], open);

    expect(siblings.map((item) => item.id)).not.toContain(open.id);
  });

  it('puts them in broadcast order', () => {
    const open = episodeOf('Show', 1, 1);
    const siblings = findSiblings([open, episodeOf('Show', 1, 3), episodeOf('Show', 1, 2)], open);

    expect(siblings.map((item) => item.episodeNumber)).toEqual([2, 3]);
  });

  it('does not stray into another season', () => {
    const open = episodeOf('Show', 1, 1);
    const siblings = findSiblings([open, episodeOf('Show', 2, 1)], open);

    expect(siblings).toEqual([]);
  });

  it('does not stray into another show', () => {
    const open = episodeOf('Show', 1, 1);
    const siblings = findSiblings([open, episodeOf('Other', 1, 2)], open);

    expect(siblings).toEqual([]);
  });

  it('finds nothing for a film, which is not part of anything', () => {
    const film = itemOf();

    expect(findSiblings([film, itemOf()], film)).toEqual([]);
  });

  it('leaves out a programme that only shares the name', () => {
    const open = itemOf({ ...episodeOf('Show', 1, 2), seriesId: 'original' });
    const remake = itemOf({ ...episodeOf('Show', 1, 1), seriesId: 'remake' });

    expect(findSiblings([open, remake], open)).toEqual([]);
  });
});
