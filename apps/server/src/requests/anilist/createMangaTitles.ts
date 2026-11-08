import { createAnswerKeeper } from '@ValenceServer/sources/createAnswerKeeper';
import { findAniListManga } from '@ValenceServer/requests/anilist/findAniListManga';
import { mangaVolumeOf } from '@ValenceServer/requests/anilist/mangaVolumeOf';
import type { MangaNames } from '@ValenceServer/requests/anilist/MangaNames';
import type { QueryWeb } from '@ValenceServer/music/web/createMusicWeb';

const NAMES_KEPT_FOR_MS = 24 * 60 * 60 * 1000;

const MOST_SERIES_A_SEARCH = 3;

type MangaTitle = { title: string; aliases: string[] };

/**
 * Names manga volumes the catalogue only knows in Japanese, Chinese or Korean the way the people
 * asking for them and the indexers sharing them do: by the series' English name, or its romaji
 * where it has none, and the volume — "The Fragrant Flower Blooms With Dignity Vol. 1" for
 * "薫る花は凛と咲く 1" — keeping the romaji and the original as other names to search by. Each
 * series is asked of AniList once a day at most.
 *
 * @param web - The way out to the web.
 * @returns How to name one volume, and how to name a search's books.
 */
const createMangaTitles = (web: QueryWeb) => {
  const known = createAnswerKeeper<MangaNames | null>(NAMES_KEPT_FOR_MS);

  const namesOf = (series: string) => known.keep(series, () => findAniListManga(web, series));

  const titleOf = (
    names: MangaNames | null,
    volume: number,
    original: string,
  ): MangaTitle | null => {
    const main = names?.english ?? names?.romaji ?? null;

    if (names === null || main === null) {
      return null;
    }

    // oxlint-disable-next-line valence/no-hard-coded-strings -- the volume marker the requests service reads a manga volume's number from, the same in every language
    const numbered = (name: string) => `${name} Vol. ${volume.toString()}`;
    const others = [names.romaji, names.english].flatMap((name) =>
      name === null || name === main ? [] : [numbered(name)],
    );

    return { title: numbered(main), aliases: [...new Set([...others, original])] };
  };

  return {
    of: async (title: string): Promise<MangaTitle | null> => {
      const volume = mangaVolumeOf(title);

      return volume === null ? null : titleOf(await namesOf(volume.series), volume.volume, title);
    },

    retitled: async <Book extends { title: string }>(books: readonly Book[]): Promise<Book[]> => {
      const series = [
        ...new Set(books.flatMap((book) => mangaVolumeOf(book.title)?.series ?? [])),
      ].slice(0, MOST_SERIES_A_SEARCH);
      const names = new Map(
        await Promise.all(series.map(async (one) => [one, await namesOf(one)] as const)),
      );

      return books.map((book) => {
        const volume = mangaVolumeOf(book.title);
        const found =
          volume === null
            ? null
            : titleOf(names.get(volume.series) ?? null, volume.volume, book.title);

        return found === null ? book : { ...book, title: found.title };
      });
    },
  };
};

type MangaTitles = ReturnType<typeof createMangaTitles>;

export type { MangaTitle, MangaTitles };

export { createMangaTitles };
