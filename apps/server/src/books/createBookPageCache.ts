import { mkdir, readFile, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { snapWidth } from './snapWidth';
import type { BookPageBytes } from './BookFile';

type CreateBookPageCacheOptions = {
  directory: string;
  openPage: (chapterId: string, page: number) => Promise<BookPageBytes | null>;
};

const WEBP_QUALITY = 82;

const EXTENSIONS = new Map([
  ['image/webp', 'webp'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
  ['image/bmp', 'bmp'],
]);

/**
 * Keeps the pages of a book once they have been drawn, a chapter to a folder.
 *
 * Getting a page means finding it inside an archive and inflating it, or in the case of a document
 * drawing it, and neither is work worth doing twice — somebody reading turns the same pages back and
 * forth, and everybody in a household reads the same volume eventually.
 *
 * Only narrowed pages are kept, and only at the widths `snapWidth` rounds to, so a page has a
 * handful of copies rather than one for every window it was ever read in. A page asked for at full
 * size is read out of the archive each time: nothing Valence draws asks for one, and keeping them made
 * the cache as large as the library it served. Serving a page marks its chapter as read now, which is
 * what the sweep reads to decide which chapters nobody has opened for a while.
 *
 * @param options - Where pages are kept, and how to read one out of its book.
 * @returns A way to read a page, from the cache where it is there.
 */
const createBookPageCache = ({ directory, openPage }: CreateBookPageCacheOptions) => {
  const chapterAt = (chapterId: string): string => join(directory, chapterId);

  const cachedAt = (chapterId: string, page: number, width: number, contentType: string): string =>
    join(
      chapterAt(chapterId),
      `${page.toString()}@${width.toString()}.${EXTENSIONS.get(contentType) ?? 'bin'}`,
    );

  const readCached = async (
    chapterId: string,
    page: number,
    width: number,
  ): Promise<BookPageBytes | null> => {
    for (const [contentType] of EXTENSIONS) {
      const bytes = await readFile(cachedAt(chapterId, page, width, contentType)).catch(() => null);

      if (bytes !== null) {
        return { bytes: new Uint8Array(bytes), contentType };
      }
    }

    return null;
  };

  const keep = async (
    chapterId: string,
    page: number,
    width: number,
    held: BookPageBytes,
  ): Promise<void> => {
    await mkdir(chapterAt(chapterId), { recursive: true }).catch(() => null);
    await writeFile(cachedAt(chapterId, page, width, held.contentType), held.bytes).catch(
      () => null,
    );
  };

  const markRead = async (chapterId: string): Promise<void> => {
    const now = new Date();

    await utimes(chapterAt(chapterId), now, now).catch(() => null);
  };

  /**
   * Draws a page down to the width somebody asked for.
   *
   * A page out of a volume is a megabyte and a half of picture and sometimes three, which is a lot to
   * send a phone for something it will draw a thousand pixels wide. Narrowed pages go out as WebP,
   * which is a great deal smaller for line art and screentone than what these archives hold.
   *
   * A page that will not draw is sent as it came rather than not at all.
   *
   * @param held - The page as it was found.
   * @param width - How wide it is wanted.
   * @returns The page, narrowed where that worked.
   */
  const narrowed = async (held: BookPageBytes, width: number): Promise<BookPageBytes> => {
    const drawn = await sharp(held.bytes)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
      .catch(() => null);

    return drawn === null ? held : { bytes: new Uint8Array(drawn), contentType: 'image/webp' };
  };

  return async (chapterId: string, page: number, width?: number): Promise<BookPageBytes | null> => {
    if (width === undefined || width <= 0) {
      return openPage(chapterId, page);
    }

    const wanted = snapWidth(width);
    const already = await readCached(chapterId, page, wanted);

    if (already !== null) {
      await markRead(chapterId);

      return already;
    }

    const read = await openPage(chapterId, page);

    if (read === null) {
      return null;
    }

    const held = await narrowed(read, wanted);

    await keep(chapterId, page, wanted, held);
    await markRead(chapterId);

    return held;
  };
};

export { createBookPageCache };
