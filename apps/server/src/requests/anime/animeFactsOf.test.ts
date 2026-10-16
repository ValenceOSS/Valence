import { describe, expect, it } from 'vitest';
import { animeFactsOf } from './animeFactsOf';
import type { AniListEntry } from '@ValenceServer/requests/anilist/AniListEntry';
import type { EpisodeGroup } from '@ValenceServer/requests/anime/EpisodeGroup';
import type { CatalogueEpisode } from '@ValenceContracts/schemas/MediaRequest';

const day = (from: string, weeks: number): string =>
  new Date(Date.parse(`${from}T00:00:00Z`) + weeks * 7 * 86_400_000).toISOString().slice(0, 10);

const season = (number: number, count: number, from: string): CatalogueEpisode[] =>
  Array.from({ length: count }, (_unused, at) => ({
    season: number,
    episode: at + 1,
    title: `Episode ${(at + 1).toString()}`,
    airDate: day(from, at),
  }));

const entry = (
  id: number,
  startDate: string,
  episodes: number | null,
  extra: Partial<AniListEntry> = {},
): AniListEntry => ({
  id,
  malId: id + 100,
  format: 'TV',
  english: `Cour ${id.toString()}`,
  romaji: `Kuuru ${id.toString()}`,
  native: null,
  synonyms: [],
  startDate,
  episodes,
  isAiring: false,
  ...extra,
});

const halves = (id: string, type: number, name = 'Cours'): EpisodeGroup => ({
  id,
  name,
  type,
  groups: [
    {
      name: 'Part 1',
      episodes: season(1, 12, '2020-01-05').map(({ season: s, episode }) => ({
        season: s,
        episode,
      })),
    },
    {
      name: 'Part 2',
      episodes: Array.from({ length: 12 }, (_unused, at) => ({ season: 1, episode: at + 13 })),
    },
  ],
});

describe('animeFactsOf', () => {
  it("takes the catalogue's seasons where they line up with AniList", () => {
    const episodes = [...season(1, 12, '2020-01-05'), ...season(2, 12, '2021-01-03')];
    const facts = animeFactsOf(
      episodes,
      [entry(1, '2020-01-06', 12), entry(2, '2021-01-03', 12)],
      [],
    );

    expect(facts.courSource).toBe('seasons');
    expect(
      facts.cours.map((cour) => [cour.cour, cour.season, cour.name, cour.episodeCount]),
    ).toEqual([
      [1, 1, 'Cour 1', 12],
      [2, 2, 'Cour 2', 12],
    ]);
    expect(facts).toMatchObject({ anilistId: 1, malId: 101 });
    expect(facts.names).toEqual({ english: 'Cour 1', romaji: 'Kuuru 1', native: null, others: [] });
    expect(facts.episodes.find((one) => one.season === 2 && one.episode === 1)).toEqual({
      season: 2,
      episode: 1,
      absolute: 13,
      cour: 2,
    });
  });

  it('takes an episode group that lines up where the seasons do not, whatever it is called', () => {
    const facts = animeFactsOf(
      season(1, 24, '2020-01-05'),
      [entry(1, '2020-01-05', 12), entry(2, day('2020-01-05', 12), 12)],
      [halves('aaaaaaaaaaaaaaaaaaaaaaaa', 7, 'TV order')],
    );

    expect(facts).toMatchObject({ courSource: 'group', groupId: 'aaaaaaaaaaaaaaaaaaaaaaaa' });
    expect(facts.cours.map((cour) => [cour.cour, cour.season, cour.firstAired])).toEqual([
      [1, null, '2020-01-05'],
      [2, null, day('2020-01-05', 12)],
    ]);
    expect(facts.groups).toEqual([
      { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'TV order', groupCount: 2 },
    ]);
  });

  it("falls back to AniList's entries, each from where it first aired", () => {
    const facts = animeFactsOf(
      season(1, 24, '2020-01-05'),
      [entry(1, '2020-01-05', 12), entry(2, day('2020-01-05', 14), 10)],
      [],
    );

    expect(facts.courSource).toBe('anilist');
    expect(facts.cours.map((cour) => [cour.anilistId, cour.episodeCount])).toEqual([
      [1, 14],
      [2, 10],
    ]);
  });

  it('trusts no group that misses an episode or holds one twice', () => {
    const missing: EpisodeGroup = {
      ...halves('bbbbbbbbbbbbbbbbbbbbbbbb', 7),
      groups: [{ name: 'All', episodes: [{ season: 1, episode: 1 }] }],
    };
    const doubled: EpisodeGroup = {
      ...halves('cccccccccccccccccccccccc', 7),
      groups: [...halves('x', 7).groups, { name: 'Again', episodes: [{ season: 1, episode: 1 }] }],
    };

    expect(animeFactsOf(season(1, 24, '2020-01-05'), [], [missing, doubled]).groups).toEqual([]);
  });

  it('numbers episodes from an absolute group, and otherwise in the order they aired', () => {
    const reversed: EpisodeGroup = {
      id: 'dddddddddddddddddddddddd',
      name: 'Absolute',
      type: 2,
      groups: [
        {
          name: 'All',
          episodes: [
            { season: 1, episode: 2 },
            { season: 1, episode: 1 },
          ],
        },
      ],
    };

    expect(
      animeFactsOf(season(1, 2, '2020-01-05'), [], [reversed]).episodes.map((one) => one.absolute),
    ).toEqual([2, 1]);
    expect(
      animeFactsOf(season(1, 2, '2020-01-05'), [], []).episodes.map((one) => one.absolute),
    ).toEqual([1, 2]);
  });

  it("keeps the catalogue's seasons and no names where AniList knows nothing", () => {
    const facts = animeFactsOf(
      [...season(0, 1, '2019-01-01'), ...season(1, 3, '2020-01-05')],
      [],
      [],
    );

    expect(facts).toMatchObject({
      courSource: 'seasons',
      anilistId: null,
      names: { english: null },
    });
    expect(facts.cours).toHaveLength(1);
    expect(facts.episodes[0]).toEqual({ season: 0, episode: 1, absolute: null, cour: 0 });
  });

  it("follows the operator's choice", () => {
    const episodes = season(1, 24, '2020-01-05');
    const entries = [entry(1, '2020-01-05', 12), entry(2, day('2020-01-05', 12), 12)];
    const group = halves('eeeeeeeeeeeeeeeeeeeeeeee', 6);

    expect(animeFactsOf(episodes, entries, [group], 'seasons').cours).toHaveLength(1);
    expect(animeFactsOf(episodes, entries, [group], 'anilist').courSource).toBe('anilist');
    expect(animeFactsOf(episodes, [], [group], 'group:eeeeeeeeeeeeeeeeeeeeeeee')).toMatchObject({
      courSource: 'group',
      cours: [{ name: 'Part 1' }, { name: 'Part 2' }],
    });
  });

  it("lists the show's films", () => {
    expect(
      animeFactsOf(season(1, 2, '2020-01-05'), [entry(9, '2022-06-01', 1, { format: 'MOVIE' })], [])
        .films,
    ).toEqual([{ anilistId: 9, title: 'Cour 9', year: 2022, tmdbId: null }]);
  });
});
