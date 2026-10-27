import { extname } from 'node:path';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { animeEpisodesOf } from '@ValenceRequests/mediaRequests/animeEpisodesOf';
import type { Numbered } from '@ValenceRequests/mediaRequests/animeEpisodesOf';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * Which of a series' episodes one video holds, by its own name: the season and episodes it numbers,
 * or the day it aired, and for anime any of the ways anime numbers its episodes, read the way the
 * release the episodes were fetched in numbers them.
 *
 * @param name - The video's name, with or without the folders it is in.
 * @param request - What was asked for, with an anime's cours.
 * @param items - The episodes it could hold.
 * @returns Those it holds.
 */
const episodesOfVideo = <Item extends Numbered>(
  name: string,
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'anime' | 'numberingByGroup'>,
  items: readonly Item[],
): Item[] => {
  const named = name.slice(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1);
  const parsed = parseReleaseName(named.slice(0, named.length - extname(named).length));

  if ((request.anime ?? null) !== null) {
    const held = animeEpisodesOf(request, items, parsed, named);

    return items.filter((item) =>
      held.some((one) => one.season === item.season && one.episode === item.episode),
    );
  }

  return items.filter(
    (item) =>
      item.season !== null &&
      item.episode !== null &&
      ((parsed.seasons[0] === item.season && parsed.episodes.includes(item.episode)) ||
        (item.airDate !== null && parsed.airDate === item.airDate)),
  );
};

export { episodesOfVideo };
