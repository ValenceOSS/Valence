import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import { isPlaceholderChapterTitle } from './isPlaceholderChapterTitle';

const LOOKED_UP_FOR = 24 * 60 * 60 * 1000;

const MOST_KEPT = 500;

type ComicChapters = {
  title: string;
  seriesName: string | null;
  chapters: { id: string; number: number; title: string }[];
};

type ChapterShelf = {
  listComicChapters: (libraryId: string) => Promise<ComicChapters[]>;
  renameChapter: (chapterId: string, title: string) => Promise<void>;
};

/**
 * Makes what fills in the names of a library's comic chapters that the files only numbered, from an
 * online catalogue. A series is looked up at most once a day however often its library is scanned,
 * and a chapter is only renamed while its title is still a placeholder.
 *
 * @param shelf - Where the chapters are kept.
 * @param find - What looks a series' chapter names up, by number.
 * @param now - The time, which a test replaces.
 * @returns What names a library's chapters, and says how many it renamed.
 */
const createChapterNamer = (
  shelf: ChapterShelf,
  find: (series: string) => Promise<ReadonlyMap<number, string>>,
  now: () => number = Date.now,
): ((libraryId: string) => Promise<number>) => {
  const lookedUp = createExpiringCache<Promise<ReadonlyMap<number, string>>>(LOOKED_UP_FOR, {
    holds: MOST_KEPT,
    now,
  });

  /**
   * Looks a series' chapter names up, or reuses a lookup made within the day.
   *
   * @param series - What the series is called.
   * @returns Each chapter's name by its number.
   */
  const namesOf = (series: string): Promise<ReadonlyMap<number, string>> => {
    const known = lookedUp.get(series);

    if (known !== undefined) {
      return known;
    }

    const names = find(series).catch(() => new Map<number, string>());

    lookedUp.set(series, names);

    return names;
  };

  return async (libraryId) => {
    let renamed = 0;

    for (const book of await shelf.listComicChapters(libraryId)) {
      const bookNames = [book.title, ...(book.seriesName === null ? [] : [book.seriesName])];
      const nameless = book.chapters.filter((chapter) =>
        isPlaceholderChapterTitle(chapter.title, bookNames),
      );

      if (nameless.length === 0) {
        continue;
      }

      const names = await namesOf(book.seriesName ?? book.title);

      for (const chapter of nameless) {
        const name = names.get(chapter.number);

        if (name !== undefined) {
          await shelf.renameChapter(chapter.id, name);
          renamed += 1;
        }
      }
    }

    return renamed;
  };
};

export { createChapterNamer };
export type { ChapterShelf, ComicChapters };
