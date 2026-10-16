import { saying } from '@ValenceI18n/saying';
import { sayingAll } from '@ValenceI18n/sayingAll';
import { sayingCount } from '@ValenceI18n/sayingCount';
import type { Said } from '@ValenceI18n/SaidSchema';
import { summariseNewMedia } from '@ValenceServer/notifications/summariseNewMedia';
import type { AddedItem, NewMediaSummary } from '@ValenceServer/notifications/summariseNewMedia';

const FRESH_FOR_DAYS = 7;

const SHOWS_TOLD_APART = 3;

/**
 * Whether an episode came out lately enough to be news on its own — this week's episode, rather than
 * one of a season from years ago that has only now reached the library.
 *
 * @param item - The episode.
 * @param now - The moment the digest runs.
 * @returns Whether it aired in the last week.
 */
const isFresh = (item: AddedItem, now: Date): boolean => {
  const aired =
    item.releaseDate === null || item.releaseDate === undefined
      ? Number.NaN
      : Date.parse(item.releaseDate);

  return !Number.isNaN(aired) && now.getTime() - aired <= FRESH_FOR_DAYS * 86_400_000;
};

/**
 * One episode that has just come out, said on its own: the programme it is of, and which episode.
 *
 * @param item - The episode.
 * @returns What to say.
 */
const newEpisode = (item: AddedItem): NewMediaSummary => ({
  title: saying('server.notifications.noticesOfNewMedia.newEpisodeOfShow', {
    show: item.seriesTitle ?? item.title,
  }),
  body:
    item.seasonNumber === null ||
    item.seasonNumber === undefined ||
    item.episodeNumber === null ||
    item.episodeNumber === undefined
      ? saying('server.notifications.noticesOfNewMedia.titleIsInYourLibrary', { title: item.title })
      : saying('server.notifications.noticesOfNewMedia.seasonEpisodeTitled', {
          season: item.seasonNumber.toString(),
          episode: item.episodeNumber.toString(),
          title: item.title,
        }),
  link: `/?item=${item.id}`,
});

/**
 * Which seasons a programme's episodes are from, to say under how many of them came.
 *
 * @param episodes - The episodes.
 * @returns The seasons in words, or that they are new to the library where none is known.
 */
const fromSeasons = (episodes: readonly AddedItem[]): Said => {
  const seasons = [
    ...new Set(
      episodes.flatMap((episode) =>
        episode.seasonNumber === null || episode.seasonNumber === undefined
          ? []
          : [episode.seasonNumber],
      ),
    ),
  ].toSorted((left, right) => left - right);
  const [only, ...others] = seasons;

  return only === undefined
    ? saying('common.somethingNewToWatch')
    : others.length === 0
      ? saying('server.notifications.noticesOfNewMedia.fromSeason', { season: only.toString() })
      : saying('server.notifications.noticesOfNewMedia.fromSeasons', {
          seasons: sayingAll([only.toString(), ...others.map((season) => season.toString())]),
        });
};

/**
 * What to tell the household of everything that reached the library in a digest's window. An
 * episode that aired in the last week is news on its own, one notice each. Older episodes — a back
 * season arriving — are one notice for each programme, saying how many came, unless several
 * programmes' came at once, as a scan of a drive brings them, when they are counted in with the
 * films and music in a single notice instead.
 *
 * @param items - Everything imported since the last digest.
 * @param now - The moment the digest runs.
 * @returns The notices, in the order to send them.
 */
const noticesOfNewMedia = (items: readonly AddedItem[], now: Date): NewMediaSummary[] => {
  const isEpisode = (item: AddedItem) => item.seriesId !== null && item.albumId === null;
  const fresh = items.filter((item) => isEpisode(item) && isFresh(item, now));
  const older = items.filter((item) => isEpisode(item) && !isFresh(item, now));
  const others = items.filter((item) => !isEpisode(item));
  const shows = new Map<string, AddedItem[]>();

  for (const item of older) {
    shows.set(item.seriesId ?? '', [...(shows.get(item.seriesId ?? '') ?? []), item]);
  }

  const isToldApart = shows.size <= SHOWS_TOLD_APART;
  const perShow = isToldApart
    ? [...shows].flatMap(([seriesId, episodes]): NewMediaSummary[] => {
        const [first] = episodes;

        return first === undefined
          ? []
          : [
              {
                title: sayingCount(
                  'server.notifications.noticesOfNewMedia.episodesOfShowAdded',
                  episodes.length,
                  { show: first.seriesTitle ?? first.title },
                ),
                body: fromSeasons(episodes),
                link: `/?show=${seriesId}`,
              },
            ];
      })
    : [];
  const rest = summariseNewMedia(isToldApart ? others : [...older, ...others]);

  return [...fresh.map(newEpisode), ...perShow, ...(rest === null ? [] : [rest])];
};

export { noticesOfNewMedia };
