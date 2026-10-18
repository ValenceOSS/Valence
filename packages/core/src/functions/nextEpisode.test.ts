import { describe, expect, it } from 'vitest';
import { nextEpisode } from './nextEpisode';
import { findSiblings } from '@ValenceCore/functions/findSiblings';
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

describe('nextEpisode', () => {
  it('finds the one after this', () => {
    const second = episodeOf('Show', 1, 2);

    expect(
      nextEpisode([episodeOf('Show', 1, 1), second, episodeOf('Show', 1, 3)], second)
        ?.episodeNumber,
    ).toBe(3);
  });

  it('finds nothing after the last one there is', () => {
    const last = episodeOf('Show', 1, 2);

    expect(nextEpisode([episodeOf('Show', 1, 1), last], last)).toBeNull();
  });

  it('runs on from the end of a season into the first episode of the next', () => {
    const finale = episodeOf('Show', 3, 12);

    expect(
      nextEpisode(
        [episodeOf('Show', 4, 2), episodeOf('Show', 3, 11), finale, episodeOf('Show', 4, 1)],
        finale,
      )?.title,
    ).toBe('Show S4E1');
  });

  it('runs on to the next season the library has, past one it does not', () => {
    const finale = episodeOf('Show', 1, 8);

    expect(nextEpisode([finale, episodeOf('Show', 3, 1)], finale)?.title).toBe('Show S3E1');
  });

  it('starts the next season at the first episode the library has of it', () => {
    const finale = episodeOf('Show', 1, 8);

    expect(
      nextEpisode([finale, episodeOf('Show', 2, 5), episodeOf('Show', 2, 3)], finale)?.title,
    ).toBe('Show S2E3');
  });

  it('never runs on out of the specials, nor into them', () => {
    const special = episodeOf('Show', 0, 2);
    const finale = episodeOf('Show', 2, 10);

    expect(nextEpisode([special, episodeOf('Show', 1, 1)], special)).toBeNull();
    expect(nextEpisode([finale, episodeOf('Show', 0, 1)], finale)).toBeNull();
  });

  it('does not run on into another show', () => {
    const finale = episodeOf('Show', 1, 1);

    expect(nextEpisode([finale, episodeOf('Other', 1, 2)], finale)).toBeNull();
  });

  it('has nothing to follow a film with', () => {
    const film = itemOf();

    expect(nextEpisode([film, itemOf()], film)).toBeNull();
  });

  it('runs on from one special into no other, since specials belong to no point in the story', () => {
    const special = episodeOf('Show', 0, 1);

    expect(nextEpisode([special, episodeOf('Show', 0, 2)], special)).toBeNull();
  });

  it('keeps apart two programmes that share a name', () => {
    const finale = itemOf({ ...episodeOf('Show', 1, 2), seriesId: 'original' });
    const remake = itemOf({ ...episodeOf('Show', 2, 1), seriesId: 'remake' });
    const sequel = itemOf({ ...episodeOf('Show', 2, 1), seriesId: 'original' });

    expect(nextEpisode([finale, remake], finale)).toBeNull();
    expect(nextEpisode([finale, remake, sequel], finale)?.id).toBe(sequel.id);
  });

  it('skips a gap where an episode is missing from the library', () => {
    const first = episodeOf('Show', 1, 1);

    expect(nextEpisode([first, episodeOf('Show', 1, 4)], first)?.episodeNumber).toBe(4);
  });
});

describe('the episodes either side of one', () => {
  it('finds the rest of a season, in order', () => {
    const items = [
      episodeOf('Some Show', 1, 3),
      episodeOf('Some Show', 1, 1),
      episodeOf('Some Show', 1, 2),
    ];

    const siblings = findSiblings(items, items[1] ?? items[0]!);

    expect(siblings.map((one) => one.episodeNumber)).toEqual([2, 3]);
  });

  it('leaves out another season, which is a different run of episodes', () => {
    const items = [episodeOf('Some Show', 1, 1), episodeOf('Some Show', 2, 1)];

    expect(findSiblings(items, items[0]!)).toEqual([]);
  });

  it('has no siblings for a film', () => {
    const film = itemOf({ title: 'A Film' });

    expect(findSiblings([film, itemOf({ title: 'Another Film' })], film)).toEqual([]);
  });

  it('answers with the next episode of the season', () => {
    const items = [episodeOf('Some Show', 1, 1), episodeOf('Some Show', 1, 2)];

    expect(nextEpisode(items, items[0]!)?.episodeNumber).toBe(2);
  });

  it('has nothing after the last episode there is', () => {
    const items = [episodeOf('Some Show', 1, 1), episodeOf('Some Show', 1, 2)];

    expect(nextEpisode(items, items[1]!)).toBeNull();
  });

  it('has nothing after a film, which is not part of a run', () => {
    const film = itemOf({ title: 'A Film' });

    expect(nextEpisode([film], film)).toBeNull();
  });

  it('treats an episode with no number as coming before the numbered ones', () => {
    const unnumbered = itemOf({
      title: 'A special',
      seriesTitle: 'Some Show',
      seasonNumber: 1,
    });
    const first = episodeOf('Some Show', 1, 1);

    expect(findSiblings([unnumbered, first], first).map((one) => one.title)).toEqual(['A special']);
  });
});
