import { partOfItem } from '@ValenceClient/requests/partOfItem';
import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueSeason, MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';

type TitleEpisode = {
  episode: number;
  aired?: { season: number; episode: number };
  title: string;
  airDate: string | null;
  part: TitlePart | 'notAsked';
  problem: string | null;
  path: string | null;
  itemId: string | null;
};

type CourSpan = {
  seasons: number[];
  first: { season: number; episode: number };
  last: { season: number; episode: number };
  firstAbsolute: number | null;
  lastAbsolute: number | null;
};

type TitleSeason = {
  season: number;
  name?: string | null;
  span?: CourSpan | null;
  episodes: TitleEpisode[];
  isAsked: boolean;
  isFollowed: boolean;
};

/**
 * Whether the library holds an episode, in a file of one episode or of several.
 *
 * @param files - The episodes the library holds.
 * @param season - The episode's season.
 * @param episode - Its number in the season.
 * @returns The file holding it, or null.
 */
const fileOf = (files: readonly TitleFile[], season: number, episode: number): string | null =>
  files.find(
    (file) =>
      file.season === season &&
      file.episode !== null &&
      episode >= file.episode &&
      episode <= (file.lastEpisode ?? file.episode),
  )?.path ?? null;

/**
 * An anime's cours as its title page lists them, one row each in place of its seasons, Specials
 * first: each episode numbered from the show's first, with the catalogue's season and episode it
 * is, where it stands and its file; and each cour's name and the span of the catalogue it covers.
 *
 * @param request - The request for it.
 * @param anime - Its cours.
 * @param files - The episodes the library holds.
 * @returns The cours.
 */
const coursOfTitle = (
  request: MediaRequest,
  anime: AnimeFacts,
  files: readonly TitleFile[],
): TitleSeason[] => {
  const placed = anime.episodes.toSorted(
    (left, right) => left.season - right.season || left.episode - right.episode,
  );
  const numbers = [...new Set(placed.map((one) => one.cour))].toSorted(
    (left, right) => left - right,
  );

  return numbers.map((number): TitleSeason => {
    const inCour = placed.filter((one) => one.cour === number);
    const asked = request.items.filter((item) => (item.cour ?? item.season) === number);
    const first = inCour[0];
    const last = inCour.at(-1);
    const episodes = inCour.map((one): TitleEpisode => {
      const item = asked.find(
        (found) => found.season === one.season && found.episode === one.episode,
      );
      const path = item?.filePath ?? fileOf(files, one.season, one.episode);

      return {
        episode: one.absolute ?? one.episode,
        aired: { season: one.season, episode: one.episode },
        title: item?.title ?? '',
        airDate: item?.airDate ?? null,
        part:
          item !== undefined
            ? partOfItem(item, request.approval)
            : path === null
              ? 'notAsked'
              : 'library',
        problem: item?.problem?.message ?? null,
        path,
        itemId: item?.id ?? null,
      };
    });

    return {
      season: number,
      name: number === 0 ? null : (anime.cours.find((cour) => cour.cour === number)?.name ?? null),
      span:
        first === undefined || last === undefined || number === 0
          ? null
          : {
              seasons: [...new Set(inCour.map((one) => one.season))],
              first: { season: first.season, episode: first.episode },
              last: { season: last.season, episode: last.episode },
              firstAbsolute: first.absolute,
              lastAbsolute: last.absolute,
            },
      episodes,
      isAsked: asked.length > 0,
      isFollowed: asked.some((item) => item.isFollowed),
    };
  });
};

/**
 * Every season of a show as its title page lists it, specials first: each episode the request waits
 * for, the library holds, or the catalogue lists, with where it stands — here, on its way, missing,
 * not asked for — its file where there is one, and whether the season is followed. Anime is listed
 * by its cours instead.
 *
 * @param request - The request for it, where there is one.
 * @param files - The episodes the library holds.
 * @param seasons - The seasons the catalogue lists.
 * @returns The seasons.
 */
const seasonsOfTitle = (
  request: MediaRequest | null,
  files: readonly TitleFile[],
  seasons: readonly CatalogueSeason[],
): TitleSeason[] => {
  const anime = request?.anime ?? null;

  if (request !== null && anime !== null) {
    return coursOfTitle(request, anime, files);
  }

  const numbers = new Set<number>([
    ...seasons.map((one) => one.season),
    ...(request?.items ?? []).flatMap((item) => (item.season === null ? [] : [item.season])),
    ...files.flatMap((file) => (file.season === null ? [] : [file.season])),
  ]);
  const pathOf = (season: number, episode: number): string | null => fileOf(files, season, episode);

  return [...numbers]
    .sort((left, right) => left - right)
    .map((season): TitleSeason => {
      const asked = (request?.items ?? []).filter((item) => item.season === season);
      const listed = seasons.find((one) => one.season === season)?.episodeCount ?? 0;
      const held = files.flatMap((file) =>
        file.season !== season || file.episode === null
          ? []
          : Array.from(
              { length: Math.max(1, (file.lastEpisode ?? file.episode) - file.episode + 1) },
              (_, offset) => (file.episode ?? 0) + offset,
            ),
      );
      const count = Math.max(listed, ...asked.map((item) => item.episode ?? 0), ...held, 0);
      const episodes = Array.from({ length: count }, (_, at): TitleEpisode => {
        const episode = at + 1;
        const item = asked.find((one) => one.episode === episode);
        const path = item?.filePath ?? pathOf(season, episode);

        return {
          episode,
          title: item?.title ?? '',
          airDate: item?.airDate ?? null,
          part:
            item !== undefined && request !== null
              ? partOfItem(item, request.approval)
              : path === null
                ? 'notAsked'
                : 'library',
          problem: item?.problem?.message ?? null,
          path,
          itemId: item?.id ?? null,
        };
      });

      return {
        season,
        episodes,
        isAsked: asked.length > 0,
        isFollowed: asked.some((item) => item.isFollowed),
      };
    });
};

export type { CourSpan, TitleEpisode, TitleSeason };

export { seasonsOfTitle };
