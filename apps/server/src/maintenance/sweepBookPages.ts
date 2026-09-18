import { join } from 'node:path';
import { PAGE_WIDTHS } from '@ValenceServer/books/snapWidth';

type CachedChapter = {
  name: string;
  lastReadMs: number;
};

type BookPageFiles = {
  listChapters: (directory: string) => Promise<CachedChapter[]>;
  listPages: (directory: string) => Promise<string[]>;
  removeChapter: (path: string) => Promise<void>;
  removePage: (path: string) => Promise<void>;
  setLastRead: (path: string, atMs: number) => Promise<void>;
};

type SweepBookPagesOptions = {
  directory: string;
  files: BookPageFiles;
  listChapterIds: () => Promise<string[]>;
  nowMs: number;
  unreadForMs?: number;
  onProblem?: (path: string, reason: string) => void;
  onProgress?: (processed: number, total: number) => void;
};

const UNREAD_FOR_MS = 30 * 24 * 60 * 60 * 1000;

const KEPT_PAGE = /^\d+@(\d+)\.[a-z]+$/;

/**
 * Whether a cached page is one the cache still makes: narrowed, and to a width it still rounds to.
 *
 * @param name - The page's file name.
 * @returns Whether to keep it.
 */
const isKeptPage = (name: string): boolean => {
  const width = KEPT_PAGE.exec(name)?.[1];

  return width !== undefined && PAGE_WIDTHS.some((kept) => kept.toString() === width);
};

/**
 * Deletes the cached pages of chapters nobody has opened for a while, and of chapters that are not
 * on the shelf any more. A page is kept the first time it is read and nothing else ever removes one,
 * so without this the cache grows toward the size of the library it serves.
 *
 * Inside a chapter still being read, it also removes pages the cache no longer makes — full-size
 * copies, and widths from before they were rounded — and then puts the chapter's last-read time back,
 * since tidying a folder is not somebody reading it.
 *
 * @param options - Where pages are kept, the shelf saying which chapters are still on it, and how
 *   long a chapter may go unread.
 * @returns How many chapters and pages were removed.
 */
const sweepBookPages = async ({
  directory,
  files,
  listChapterIds,
  nowMs,
  unreadForMs = UNREAD_FOR_MS,
  onProblem,
  onProgress,
}: SweepBookPagesOptions): Promise<number> => {
  const live = new Set(await listChapterIds());
  const chapters = await files.listChapters(directory);
  let removed = 0;

  onProgress?.(0, chapters.length);

  for (const [index, chapter] of chapters.entries()) {
    const at = join(directory, chapter.name);

    if (!live.has(chapter.name) || nowMs - chapter.lastReadMs > unreadForMs) {
      await files
        .removeChapter(at)
        .then(() => {
          removed += 1;
        })
        .catch((error: Error) => {
          onProblem?.(at, error.message);
        });
    } else {
      const stray = (await files.listPages(at)).filter((name) => !isKeptPage(name));

      for (const name of stray) {
        await files
          .removePage(join(at, name))
          .then(() => {
            removed += 1;
          })
          .catch((error: Error) => {
            onProblem?.(join(at, name), error.message);
          });
      }

      if (stray.length > 0) {
        await files.setLastRead(at, chapter.lastReadMs).catch(() => null);
      }
    }

    onProgress?.(index + 1, chapters.length);
  }

  return removed;
};

export type { BookPageFiles, CachedChapter };

export { sweepBookPages };
