import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const WEEK_MS = 7 * 86_400_000;

/**
 * A calendar date some weeks after another.
 *
 * @param from - The first date.
 * @param weeks - How many weeks after it.
 * @returns The date.
 */
const weeksAfter = (from: string, weeks: number): string =>
  new Date(Date.parse(`${from}T00:00:00Z`) + weeks * WEEK_MS).toISOString().slice(0, 10);

/**
 * An anime of three cours, with an episode wanted for each of its episodes: the catalogue's first
 * season is two cours of twelve, "Show" and "Show Second Arc", aired weekly from the start of 2020,
 * and its second season is the third cour, "Show Final Season", aired weekly from the start of 2021.
 *
 * @returns The show's cours and numbers, and its episodes as a request keeps them.
 */
const anAnimeShow = (): { anime: AnimeFacts; items: RequestItemRecord[] } => {
  const places = [
    ...Array.from({ length: 24 }, (_unused, at) => ({
      season: 1,
      episode: at + 1,
      absolute: at + 1,
      cour: at < 12 ? 1 : 2,
      airDate: weeksAfter('2020-01-05', at),
    })),
    ...Array.from({ length: 12 }, (_unused, at) => ({
      season: 2,
      episode: at + 1,
      absolute: at + 25,
      cour: 3,
      airDate: weeksAfter('2021-01-03', at),
    })),
  ];
  const cour = (number: number, name: string, season: number | null, firstAired: string) => ({
    cour: number,
    name,
    names: [name],
    anilistId: number,
    malId: null,
    season,
    firstAired,
    episodeCount: 12,
  });

  return {
    anime: {
      anilistId: 1,
      malId: null,
      names: { english: 'Show', romaji: 'Shou', native: null, others: [] },
      cours: [
        cour(1, 'Show', null, '2020-01-05'),
        cour(2, 'Show Second Arc', null, weeksAfter('2020-01-05', 12)),
        cour(3, 'Show Final Season', 2, '2021-01-03'),
      ],
      episodes: places.map(({ season, episode, absolute, cour: number }) => ({
        season,
        episode,
        absolute,
        cour: number,
      })),
      courSource: 'anilist',
      groupId: null,
      groups: [],
      films: [],
    },
    items: places.map((place, at) =>
      aRequestItem({
        id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
        season: place.season,
        episode: place.episode,
        cour: place.cour,
        absolute: place.absolute,
        title: `Episode Title ${place.absolute.toString()}`,
        airDate: place.airDate,
      }),
    ),
  };
};

export { anAnimeShow };
