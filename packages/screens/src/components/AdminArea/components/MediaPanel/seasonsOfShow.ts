import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { TitleEpisode, TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';

/**
 * The file holding an episode, in a file of one episode or of several.
 *
 * @param files - The season's files.
 * @param episode - The episode's number in the season.
 * @returns The file, or nothing where the library does not hold it.
 */
const fileOf = (files: readonly MediaSummary[], episode: number): MediaSummary | undefined =>
  files.find(
    (file) =>
      file.episodeNumber !== null &&
      file.episodeNumber !== undefined &&
      episode >= file.episodeNumber &&
      episode <= (file.episodeNumberEnd ?? file.episodeNumber),
  );

/**
 * Every season of a programme as Media's title page lists it, specials first: each episode the
 * catalogue lists or the library holds, with its title, when it aired, whether it is here, missing
 * or not out yet, and its file where there is one.
 *
 * @param show - The programme, with its files and the catalogue's record of it.
 * @param paths - Where each file is, by its item.
 * @param today - Today, as YYYY-MM-DD, against which an episode is not out yet.
 * @returns The seasons.
 */
const seasonsOfShow = (
  show: ShowDetail,
  paths: Readonly<Record<string, string>>,
  today: string,
): TitleSeason[] => {
  const shape = show.shape ?? [];
  const numbers = new Set<number>([
    ...shape.map((one) => one.seasonNumber),
    ...show.seasons.flatMap((one) => (one.seasonNumber === null ? [] : [one.seasonNumber])),
  ]);

  return [...numbers]
    .sort((left, right) => left - right)
    .map((season): TitleSeason => {
      const listed = shape.find((one) => one.seasonNumber === season);
      const files = show.seasons.find((one) => one.seasonNumber === season)?.episodes ?? [];
      const count = Math.max(
        listed?.episodeCount ?? 0,
        ...(listed?.episodes ?? []).map((one) => one.episodeNumber),
        ...files.map((file) => file.episodeNumberEnd ?? file.episodeNumber ?? 0),
        0,
      );
      const episodes = Array.from({ length: count }, (_, at): TitleEpisode => {
        const episode = at + 1;
        const file = fileOf(files, episode);
        const catalogued = listed?.episodes.find((one) => one.episodeNumber === episode);
        const airDate = catalogued?.airDate ?? file?.releaseDate ?? null;

        return {
          episode,
          title: (file?.episodeNumber === episode ? file.title : null) ?? catalogued?.title ?? '',
          airDate,
          part:
            file !== undefined
              ? 'library'
              : airDate !== null && airDate > today
                ? 'waiting'
                : 'missing',
          problem: null,
          path: file === undefined ? null : (paths[file.id] ?? null),
          itemId: null,
          mediaId: file?.id ?? null,
        };
      });

      return {
        season,
        name: listed?.name ?? null,
        episodes,
        isAsked: false,
        isFollowed: false,
      };
    });
};

export { seasonsOfShow };
