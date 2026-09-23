import { basename, dirname, extname, join } from 'node:path';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { placeFile } from '@ValenceRequests/mediaRequests/placeFile';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Fileable = Pick<RequestItemRecord, 'id' | 'title'>;

type Filed = { filed: ReadonlyMap<string, string>; missing: readonly string[] };

const COVER = /^(cover|folder|front|poster)\.(jpe?g|png)$/i;

const PICTURE = /\.(jpe?g|png)$/i;

const LEADING_NUMBER = /^\s*\d{1,3}[\s.\-_]+/;

const IN_ORDER = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/**
 * A file's extension, lower case and without its dot.
 *
 * @param name - The file's name.
 * @returns Its extension.
 */
const extensionOf = (name: string): string => extname(name).slice(1).toLowerCase();

/**
 * The folder a book is filed in: its author's folder, where the request names one, and within it a
 * folder for the book, since the library reads every file in one folder as one book.
 *
 * @param libraryPath - Where the books library is.
 * @param author - Who wrote it, where known.
 * @param title - The book's title.
 * @returns The folder.
 */
const bookFolderOf = (libraryPath: string, author: string | null, title: string): string =>
  author === null || safeFileName(author) === ''
    ? join(libraryPath, safeFileName(title))
    : join(libraryPath, safeFileName(author), safeFileName(title));

/**
 * The name an audiobook's track is filed under: its place in the book first, so the library reads
 * the tracks as chapters in order, then the rest of its own name.
 *
 * @param file - The track.
 * @param place - Where it comes, counting from one.
 * @param count - How many tracks the book has, to pad every number to the same width.
 * @returns The name.
 */
const trackNameOf = (file: DownloadedFile, place: number, count: number): string => {
  const stem = basename(file.name, extname(file.name)).replace(LEADING_NUMBER, '');
  const number = place.toString().padStart(Math.max(count.toString().length, 2), '0');

  return `${number} - ${safeFileName(stem) || 'Part'}.${extensionOf(file.name)}`;
};

/**
 * Files a finished download of a book into its library, where the library will find it: every file
 * for one book in one folder — the text to read under the book's own name, and the tracks to listen
 * to numbered in their order, however many folders the download split them across — with its cover
 * beside them. A download holding both a book to read and the same book to hear files them as one
 * book the library can open either way.
 *
 * Cue sheets, checksums and notes are left behind: a cue names the file it describes, and a track
 * filed under its place in the book no longer carries that name. Nothing is moved out of a torrent
 * that is still seeding; its files are linked or copied instead.
 *
 * @param request - What was asked for, and where its library is.
 * @param items - The book the download was fetched for.
 * @param contentPath - Where the download is, as this service sees it.
 * @param isKeepingSource - Whether the download must keep its files, as a seeding torrent must.
 * @returns Where each book was filed, and the ones nothing in the download could be filed as.
 */
const fileBook = async (
  request: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'artistName'>,
  items: readonly Fileable[],
  contentPath: string,
  isKeepingSource: boolean,
): Promise<Filed> => {
  const files = await findDownloadedFiles(contentPath);
  const texts = files.filter((file) => BOOK_FILE_FORMATS.has(extensionOf(file.name)));
  const tracks = files
    .filter((file) => AUDIOBOOK_FILE_EXTENSIONS.has(extensionOf(file.name)))
    .toSorted((left, right) => IN_ORDER.compare(left.path, right.path));
  const filed = new Map<string, string>();
  const missing: string[] = [];

  for (const item of items) {
    if (texts.length === 0 && tracks.length === 0) {
      missing.push(item.id);
      continue;
    }

    const title = safeFileName(item.title) || safeFileName(request.title) || 'Book';
    const folder = bookFolderOf(request.libraryPath, request.artistName, title);

    for (const text of texts) {
      const name =
        texts.length === 1
          ? `${title}.${extensionOf(text.name)}`
          : `${safeFileName(basename(text.name, extname(text.name))) || title}.${extensionOf(text.name)}`;

      await placeFile(text.path, join(folder, name), isKeepingSource);
    }

    for (const [at, track] of tracks.entries()) {
      const name =
        tracks.length === 1
          ? `${title}.${extensionOf(track.name)}`
          : trackNameOf(track, at + 1, tracks.length);

      await placeFile(track.path, join(folder, name), isKeepingSource);
    }

    const beside = [...texts, ...tracks].map((file) => dirname(file.path));
    const pictures = files.filter(
      (file) =>
        PICTURE.test(file.name) &&
        beside.some((near) => `${near}/`.startsWith(`${dirname(file.path)}/`)),
    );
    const cover =
      pictures.find((file) => COVER.test(file.name)) ??
      (pictures.length === 1 ? pictures[0] : undefined);

    if (cover !== undefined) {
      await placeFile(
        cover.path,
        join(folder, `cover.${extensionOf(cover.name)}`),
        isKeepingSource,
      );
    }

    filed.set(item.id, folder);
  }

  return { filed, missing };
};

export { fileBook };
