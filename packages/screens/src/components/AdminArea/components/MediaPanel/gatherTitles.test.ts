import { describe, expect, it } from 'vitest';
import { gatherTitles } from './gatherTitles';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const item = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'film-1',
  libraryId: 'films',
  title: 'Parasite',
  year: 2019,
  durationSeconds: 7920,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  externalId: 'tmdb-1',
  sizeBytes: 100,
  ...overrides,
});

const episode = (id: string, season: number | null, number: number, overrides = {}) =>
  item({
    id,
    libraryId: 'shows',
    title: `Episode ${number.toString()}`,
    seriesId: 'from',
    seriesTitle: 'From',
    seasonNumber: season,
    episodeNumber: number,
    ...overrides,
  });

describe('gatherTitles', () => {
  it('keeps each film on its own', () => {
    const [film] = gatherTitles([item()]);

    expect(film).toMatchObject({ kind: 'film', name: 'Parasite', sizeBytes: 100, isMatched: true });
  });

  it('gathers a series’ episodes under it in the order they are watched', () => {
    const [series] = gatherTitles([
      episode('s2e1', 2, 1),
      episode('s1e2', 1, 2),
      episode('s1e1', 1, 1),
    ]);

    expect(series?.kind).toBe('series');
    expect(series?.name).toBe('From');
    expect(series?.episodes.map((one) => one.id)).toEqual(['s1e1', 's1e2', 's2e1']);
    expect(series?.seasons).toBe(2);
  });

  it('sizes and dates a series by every episode, not the first', () => {
    const [series] = gatherTitles([
      episode('a', 1, 1, { sizeBytes: 100, addedAt: '2026-01-01T00:00:00.000Z' }),
      episode('b', 1, 2, { sizeBytes: 250, addedAt: '2026-03-01T00:00:00.000Z' }),
    ]);

    expect(series?.sizeBytes).toBe(350);
    expect(series?.addedAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('takes a series’ poster from whichever episode has one', () => {
    const [series] = gatherTitles([
      episode('a', 1, 1, { hasPoster: false }),
      episode('b', 1, 2, { hasPoster: true }),
    ]);

    expect(series?.posterFrom).toBe('b');
  });

  it('calls a title unmatched where nothing in it has a catalogue match', () => {
    const [film] = gatherTitles([item({ externalId: null })]);

    expect(film?.isMatched).toBe(false);
  });

  it('keeps two libraries’ series of the same name apart, and orders titles by name', () => {
    const titles = gatherTitles([
      episode('a', 1, 1),
      episode('b', 1, 1, { libraryId: 'anime' }),
      item({ id: 'z', title: 'Zodiac' }),
      item({ id: 'x', title: 'Alien' }),
    ]);

    expect(titles.map((title) => title.name)).toEqual(['Alien', 'From', 'From', 'Zodiac']);
  });

  it('puts a series’ seasons beneath it, each holding its episodes, specials after the rest', () => {
    const [series] = gatherTitles([
      episode('s0e1', 0, 1),
      episode('s2e1', 2, 1),
      episode('s1e1', 1, 1),
      episode('s1e2', 1, 2),
    ]);

    expect(series?.parts.map((part) => [part.kind, part.name])).toEqual([
      ['season', 'Season 1'],
      ['season', 'Season 2'],
      ['season', 'Specials'],
    ]);
    expect(series?.parts[0]?.parts.map((part) => part.id)).toEqual(['s1e1', 's1e2']);
    expect(series?.parts[0]?.sizeBytes).toBe(200);
  });

  it('puts the episodes of a one-season series straight beneath it', () => {
    const [series] = gatherTitles([episode('a', 1, 1), episode('b', 1, 2)]);

    expect(series?.parts.map((part) => [part.kind, part.id])).toEqual([
      ['episode', 'a'],
      ['episode', 'b'],
    ]);
  });

  it('lists a film once, with its other versions beneath it as editions', () => {
    const [heat, ...rest] = gatherTitles([
      item({ id: 'main', title: 'Heat', sizeBytes: 100 }),
      item({
        id: 'cut',
        title: 'Heat',
        parentId: 'main',
        versionLabel: 'Extended Cut',
        sizeBytes: 50,
      }),
    ]);

    expect(rest).toEqual([]);
    expect(heat?.sizeBytes).toBe(150);
    expect(heat?.parts.map((part) => [part.kind, part.name, part.lead.id])).toEqual([
      ['version', 'Original', 'main'],
      ['version', 'Extended Cut', 'cut'],
    ]);
  });

  it('keeps a version whose film is not listed as a film of its own', () => {
    const titles = gatherTitles([item({ id: 'cut', parentId: 'elsewhere', versionLabel: 'Cut' })]);

    expect(titles.map((title) => [title.kind, title.id])).toEqual([['film', 'cut']]);
  });

  it('puts an episode’s other versions beneath it, and counts them in the size', () => {
    const [series] = gatherTitles([
      episode('e1', 1, 1, { sizeBytes: 100 }),
      episode('e1b', 1, 1, { parentId: 'e1', versionLabel: 'Bluray-1080p', sizeBytes: 10 }),
      episode('e2', 1, 2, { sizeBytes: 100 }),
    ]);

    expect(series?.episodes.map((one) => one.id)).toEqual(['e1', 'e2']);
    expect(series?.sizeBytes).toBe(210);
    expect(series?.parts[0]?.parts.map((part) => [part.name, part.lead.id])).toEqual([
      ['Original', 'e1'],
      ['Bluray-1080p', 'e1b'],
    ]);
  });
});
