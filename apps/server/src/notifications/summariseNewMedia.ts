import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { CountedKey } from '@ValenceI18n/CountedKey';

type AddedItem = {
  id: string;
  title: string;
  seriesId: string | null;
  seriesTitle: string | null;
  albumId: string | null;
  albumTitle: string | null;
};

type NewMediaSummary = {
  title: string;
  body: string;
  link: string | null;
};

const NAMED_AT_MOST = 3;

/**
 * Joins a list of names the way somebody writing the sentence would — commas between, "and" before
 * the last — so a notification reads as English rather than as a list.
 *
 * @param names - The names to join.
 * @returns The names as a phrase.
 */
const inWords = (names: string[]): string => {
  const shown = names.slice(0, NAMED_AT_MOST);
  const rest = names.length - shown.length;
  const listed =
    shown.length <= 1
      ? (shown[0] ?? '')
      : say('server.newMedia.andLast', {
          names: shown.slice(0, -1).join(', '),
          last: shown[shown.length - 1] ?? '',
        });

  return rest === 0
    ? listed
    : say('server.newMedia.andMore', { names: listed, count: rest.toString() });
};

/**
 * Gathers the items that belong to something larger — the episodes of a programme, the songs of an
 * album — under that larger thing, counting how many of each arrived.
 *
 * @param items - The items that belong to something.
 * @param idOf - Which larger thing an item belongs to.
 * @param titleOf - What that larger thing is called.
 * @returns Each larger thing, by its identifier.
 */
const gather = (
  items: AddedItem[],
  idOf: (item: AddedItem) => string,
  titleOf: (item: AddedItem) => string,
): Map<string, { title: string; count: number }> => {
  const gathered = new Map<string, { title: string; count: number }>();

  for (const item of items) {
    const id = idOf(item);
    const held = gathered.get(id);

    gathered.set(id, { title: held?.title ?? titleOf(item), count: (held?.count ?? 0) + 1 });
  }

  return gathered;
};

/**
 * Says how many of something there were, in the singular or the plural as the count needs.
 *
 * @param count - How many.
 * @param key - The words for that many.
 * @returns The count in words, or nothing where there were none.
 */
const counted = (count: number, key: CountedKey): string[] =>
  count === 0 ? [] : [sayCount(key, count)];

/**
 * Turns everything imported in a window into the one thing worth saying about it — a film by name, or
 * a count and what most of it was. Somebody who has just scanned a drive should be told their
 * library grew, not told two hundred times that it did. Songs are counted as songs and named by
 * their albums, since an album is what somebody adds, not fifteen separate films.
 *
 * @param items Everything imported since the last digest.
 */
const summariseNewMedia = (items: AddedItem[]): NewMediaSummary | null => {
  if (items.length === 0) {
    return null;
  }

  const songs = items.filter((item) => item.albumId !== null);
  const films = items.filter((item) => item.seriesId === null && item.albumId === null);
  const episodes = items.filter((item) => item.seriesId !== null && item.albumId === null);

  const series = gather(
    episodes,
    (episode) => episode.seriesId ?? '',
    (episode) => episode.seriesTitle ?? episode.title,
  );

  const albums = gather(
    songs,
    (song) => song.albumId ?? '',
    (song) => song.albumTitle ?? song.title,
  );

  const programmes = [...series.values()];
  const records = [...albums.values()];

  const names = [
    ...programmes.map((one) => one.title),
    ...records.map((one) => one.title),
    ...films.map((film) => film.title),
  ];

  const isAlone = (count: number) => count === items.length;
  const only = films.length === 1 && isAlone(1) ? films[0] : undefined;
  const onlySeries =
    programmes.length === 1 && isAlone(episodes.length) ? [...series.keys()][0] : undefined;
  const onlyAlbum =
    records.length === 1 && isAlone(songs.length) ? [...albums.keys()][0] : undefined;

  const words = [
    ...counted(episodes.length, 'server.newMedia.episodes'),
    ...counted(films.length, 'server.newMedia.films'),
    ...counted(songs.length, 'server.newMedia.songs'),
  ];

  return {
    title: isAlone(songs.length)
      ? say('server.newMedia.toListenTo')
      : songs.length === 0
        ? say('server.newMedia.toWatch')
        : say('server.newMedia.something'),
    body: say('server.newMedia.body', {
      counts: words.reduce((joined, next) => say('server.newMedia.and', { joined, next })),
      names: inWords(names),
    }),
    link:
      only !== undefined
        ? `/?item=${only.id}`
        : onlySeries !== undefined
          ? `/?show=${onlySeries}`
          : onlyAlbum === undefined
            ? null
            : `/music?listen=album:${onlyAlbum}`,
  };
};

export { summariseNewMedia };

export type { AddedItem };
