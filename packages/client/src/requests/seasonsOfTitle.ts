import { partOfItem } from '@ValenceClient/requests/partOfItem';
import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueSeason, MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';

type TitleEpisode = {
  episode: number;
  title: string;
  airDate: string | null;
  part: TitlePart | 'notAsked';
  problem: string | null;
  path: string | null;
  itemId: string | null;
};

type TitleSeason = {
  season: number;
  episodes: TitleEpisode[];
  isAsked: boolean;
  isFollowed: boolean;
};

/**
 * Every season of a show as its title page lists it, specials first: each episode the request waits
 * for, the library holds, or the catalogue lists, with where it stands — here, on its way, missing,
 * not asked for — its file where there is one, and whether the season is followed.
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
  const numbers = new Set<number>([
    ...seasons.map((one) => one.season),
    ...(request?.items ?? []).flatMap((item) => (item.season === null ? [] : [item.season])),
    ...files.flatMap((file) => (file.season === null ? [] : [file.season])),
  ]);
  const pathOf = (season: number, episode: number): string | null =>
    files.find(
      (file) =>
        file.season === season &&
        file.episode !== null &&
        episode >= file.episode &&
        episode <= (file.lastEpisode ?? file.episode),
    )?.path ?? null;

  return [...numbers]
    .toSorted((left, right) => left - right)
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

export type { TitleEpisode, TitleSeason };

export { seasonsOfTitle };
