import { describe, expect, it } from 'vitest';
import type { HealthItem, LibraryHealth } from '@ValenceContracts/schemas/LibraryHealth';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { describeTitleProblems } from './describeTitleProblems';
import type { MediaTitle } from './MediaTitle.types';

const summary = (id: string): MediaSummary => ({
  id,
  libraryId: 'shows',
  title: id,
  year: 2013,
  durationSeconds: 1200,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-10-01T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
});

const title = (overrides: Partial<MediaTitle> = {}): MediaTitle => ({
  id: 'series-1',
  libraryId: 'shows',
  kind: 'series',
  name: 'A series',
  order: 'a series',
  year: 2013,
  lead: summary('lead'),
  episodes: [summary('e1'), summary('e2'), summary('e3')],
  parts: [],
  seasons: 1,
  sizeBytes: null,
  addedAt: '2026-10-01T00:00:00.000Z',
  posterFrom: 'lead',
  isMatched: true,
  ...overrides,
});

const healthItem = (id: string, path: string, group: string | null): HealthItem => ({
  id,
  title: id,
  year: 2013,
  libraryId: 'shows',
  libraryName: 'Shows',
  path,
  group,
});

const health = (overrides: Partial<LibraryHealth> = {}): LibraryHealth => ({
  checkedAt: '2026-11-03T00:00:00.000Z',
  titles: 1,
  unmatched: { total: 0, items: [] },
  noArtwork: { total: 0, items: [] },
  duplicate: { total: 0, items: [] },
  unreadable: { total: 0, items: [] },
  ...overrides,
});

describe('describeTitleProblems', () => {
  it('finds nothing wrong with a matched title that has a poster', () => {
    expect(describeTitleProblems(title(), health())).toEqual({ problems: [], details: [] });
  });

  it('says a title is unmatched, and not also that it lacks a poster', () => {
    expect(
      describeTitleProblems(title({ isMatched: false, posterFrom: null }), health()).problems,
    ).toEqual(['unmatched']);
  });

  it('says a matched film has no poster', () => {
    expect(
      describeTitleProblems(title({ kind: 'film', posterFrom: null, episodes: [] }), health())
        .problems,
    ).toEqual(['noPoster']);
  });

  it('says nothing of a poster for a series, which the server does not count as missing one', () => {
    expect(describeTitleProblems(title({ posterFrom: null }), health()).problems).toEqual([]);
  });

  it('says nothing of a poster for a season or episode, which show the series’ own', () => {
    expect(
      describeTitleProblems(title({ kind: 'season', posterFrom: null }), health()).problems,
    ).toEqual([]);
    expect(
      describeTitleProblems(title({ kind: 'episode', posterFrom: null, episodes: [] }), health())
        .problems,
    ).toEqual([]);
  });

  it('names the episode files that share a number, and the number they share', () => {
    const described = describeTitleProblems(
      title(),
      health({
        duplicate: {
          total: 2,
          items: [
            healthItem('e1', '/shows/A series/Season 1/Pilot S01E01.mkv', 'series-1:1:1'),
            healthItem('e2', '/shows/A series/Season 1/A series S01E01.mkv', 'series-1:1:1'),
          ],
        },
      }),
    );

    expect(described.problems).toEqual(['twice']);
    expect(described.details).toEqual([
      'Numbered S1 E1 more than once: Pilot S01E01.mkv and A series S01E01.mkv',
    ]);
  });

  it('names only the other file under an episode that is itself one of them', () => {
    const described = describeTitleProblems(
      title({ kind: 'episode', lead: summary('e1'), episodes: [] }),
      health({
        duplicate: {
          total: 2,
          items: [
            healthItem('e1', '/shows/A series/Season 1/Pilot S01E01.mkv', 'series-1:1:1'),
            healthItem('e2', '/shows/A series/Season 1/A series S01E01.mkv', 'series-1:1:1'),
          ],
        },
      }),
    );

    expect(described.details).toEqual(['Also numbered S1 E1: A series S01E01.mkv']);
  });

  it('names the other copy a film shares its match with, even when that copy is another title', () => {
    const described = describeTitleProblems(
      title({ kind: 'film', lead: summary('f1'), episodes: [] }),
      health({
        duplicate: {
          total: 2,
          items: [
            healthItem('f1', '/films/One (2013)/One (2013).mkv', 'film:603'),
            healthItem('f2', '/films/Other (2013)/Other (2013).mkv', 'film:603'),
          ],
        },
      }),
    );

    expect(described.details).toEqual(['Matched to the same film as Other (2013).mkv']);
  });

  it('names the files that could not be read, and how many more past the first few', () => {
    const described = describeTitleProblems(
      title({ episodes: ['e1', 'e2', 'e3', 'e4', 'e5'].map(summary) }),
      health({
        unreadable: {
          total: 5,
          items: ['e1', 'e2', 'e3', 'e4', 'e5'].map((id) =>
            healthItem(id, `/shows/A series/${id}.mkv`, null),
          ),
        },
      }),
    );

    expect(described.problems).toEqual(['unreadable']);
    expect(described.details).toEqual(['Couldn’t read e1.mkv, e2.mkv, e3.mkv and 2 more']);
  });

  it('names the files of a server that writes its paths the Windows way', () => {
    const described = describeTitleProblems(
      title({ kind: 'film', lead: summary('f1'), episodes: [] }),
      health({
        duplicate: {
          total: 2,
          items: [
            healthItem('f1', 'D:\\Films\\One.mkv', 'film:603'),
            healthItem('f2', 'D:\\Films\\Other.mkv', 'film:603'),
          ],
        },
      }),
    );

    expect(described.details).toEqual(['Matched to the same film as Other.mkv']);
  });

  it('names only the other copies under an edition that is itself one of them', () => {
    const described = describeTitleProblems(
      title({ kind: 'version', lead: summary('f1'), episodes: [] }),
      health({
        duplicate: {
          total: 2,
          items: [
            healthItem('f1', '/films/One.mkv', 'film:603'),
            healthItem('f2', '/films/Other.mkv', 'film:603'),
          ],
        },
      }),
    );

    expect(described.details).toEqual(['Matched to the same film as Other.mkv']);
  });

  it('ignores problems belonging to other titles', () => {
    expect(
      describeTitleProblems(
        title(),
        health({
          unreadable: { total: 1, items: [healthItem('elsewhere', '/films/x.mkv', null)] },
        }),
      ),
    ).toEqual({ problems: [], details: [] });
  });
});
