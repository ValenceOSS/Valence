import { basename, dirname, extname, join } from 'node:path';
import { parseFile } from 'music-metadata';
import { audiobookTitleOf } from '@ValenceContracts/functions/audiobookTitleOf';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { placeFile } from '@ValenceRequests/mediaRequests/placeFile';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Fileable = Pick<RequestItemRecord, 'id' | 'title'>;

type Filed = { filed: ReadonlyMap<string, string>; missing: readonly string[] };

type SoundTags = { album: string | null; title: string | null; author: string | null };

type Naming = {
  isNamedByItsFiles?: boolean;
  readTags?: (path: string) => Promise<SoundTags | null>;
};

type BookInDownload = {
  texts: DownloadedFile[];
  tracks: DownloadedFile[];
  title: string | null;
  author: string | null;
};

const COVER = /^(cover|folder|front|poster)\.(jpe?g|png)$/i;

const PICTURE = /\.(jpe?g|png)$/i;

const LEADING_NUMBER = /^\s*\d{1,3}[\s.\-_]+/;

const IN_ORDER = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const DISC = /^(cd|dis[ck]|part)\s*\d+$/i;

/**
 * What a track's own tags say of the book it belongs to, read without its pictures.
 *
 * @param path - The track.
 * @returns Its album, title and author, or nothing where it cannot be read.
 */
const readSoundTags = async (path: string): Promise<SoundTags | null> => {
  try {
    const { common } = await parseFile(path, { duration: false, skipCovers: true });

    return {
      album: common.album ?? null,
      title: common.title ?? null,
      author: common.albumartist ?? common.artist ?? null,
    };
  } catch {
    return null;
  }
};

/**
 * The folder a file's book is in, taking a disc's folder as part of the book around it.
 *
 * @param file - The file.
 * @returns The book's folder.
 */
const bookFolderInDownload = (file: DownloadedFile): string => {
  let folder = dirname(file.path);

  while (DISC.test(basename(folder))) {
    folder = dirname(folder);
  }

  return folder;
};

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
 * The books a download holds. Most hold one; a pack holds several, each audiobook told apart by the
 * album its tracks are tagged with, or by its folder where they are not tagged, a disc's folder
 * being part of the book around it. Text to read goes with the audiobook in its own folder, so a
 * book to read and the same book to hear are still one book; where there is no audiobook, all the
 * text is one book, as it is several formats of it.
 *
 * @param files - Every file in the download.
 * @param readTags - How a track's tags are read.
 * @returns The books, each with its text, its tracks in order, and what its tags call it.
 */
const booksInDownload = async (
  files: readonly DownloadedFile[],
  readTags: (path: string) => Promise<SoundTags | null>,
): Promise<BookInDownload[]> => {
  const texts = files.filter((file) => {
    const format = BOOK_FILE_FORMATS.get(extensionOf(file.name));

    return format !== undefined && !isAudiobookFormat(format);
  });
  const tracks = files
    .filter((file) => AUDIOBOOK_FILE_EXTENSIONS.has(extensionOf(file.name)))
    .toSorted((left, right) => IN_ORDER.compare(left.path, right.path));
  const heard = new Map<string, BookInDownload & { folder: string }>();

  for (const track of tracks) {
    const tags = await readTags(track.path);
    const title = tags === null ? null : audiobookTitleOf(tags);
    const folder = bookFolderInDownload(track);
    const key = `${folder}\u0000${(tags?.album ?? '').toLowerCase()}`;
    const book: BookInDownload & { folder: string } = heard.get(key) ?? {
      folder,
      texts: [],
      tracks: [],
      title,
      author: tags?.author ?? null,
    };

    book.tracks.push(track);
    heard.set(key, book);
  }

  const books = [...heard.values()];

  if (books.length <= 1) {
    return books.length === 0 && texts.length === 0
      ? []
      : [
          {
            texts,
            tracks,
            title: books[0]?.title ?? null,
            author: books[0]?.author ?? null,
          },
        ];
  }

  const alone: BookInDownload[] = [];

  for (const text of texts) {
    const beside = books.filter((book) => book.folder === bookFolderInDownload(text));

    if (beside.length === 1 && beside[0] !== undefined) {
      beside[0].texts.push(text);
    } else {
      alone.push({
        texts: [text],
        tracks: [],
        title: basename(text.name, extname(text.name)),
        author: null,
      });
    }
  }

  return [
    ...books.map((book) => ({
      ...book,
      title: book.title ?? basename(book.folder),
    })),
    ...alone,
  ];
};

/**
 * Whether a picture in a download is of a book: any picture in or above the book's own folders
 * where the download is the one book, and in a pack only one in the book's own folder — named after
 * one of its files, where that folder holds more than one book.
 *
 * @param picture - The picture.
 * @param book - The book.
 * @param books - Every book in the download.
 * @returns Whether it is of the book.
 */
const isPictureOf = (
  picture: DownloadedFile,
  book: BookInDownload,
  books: readonly BookInDownload[],
): boolean => {
  const own = [...book.texts, ...book.tracks];
  const at = dirname(picture.path);

  if (books.length === 1) {
    return own.some((file) => `${dirname(file.path)}/`.startsWith(`${at}/`));
  }

  const isOwnFolder = own.some(
    (file) => dirname(file.path) === at || bookFolderInDownload(file) === at,
  );
  const isShared =
    books.filter((other) =>
      [...other.texts, ...other.tracks].some((file) => bookFolderInDownload(file) === at),
    ).length > 1;
  const stem = basename(picture.name, extname(picture.name)).toLowerCase();

  return (
    isOwnFolder &&
    (!isShared ||
      own.some((file) => basename(file.name, extname(file.name)).toLowerCase() === stem))
  );
};

/**
 * The folder every book in a pack was filed under: the one they share, which is their author's
 * where they have one author, and the first book's own folder otherwise.
 *
 * @param folders - Where each book was filed.
 * @param libraryPath - Where the books library is.
 * @returns The folder.
 */
const sharedFolderOf = (folders: readonly string[], libraryPath: string): string | undefined => {
  const parents = new Set(folders.map((folder) => dirname(folder)));
  const [only] = parents;

  return parents.size === 1 && only !== undefined && only !== libraryPath ? only : folders[0];
};

/**
 * Files a finished download of a book into its library, where the library will find it: every file
 * for one book in one folder — the text to read under the book's own name, and the tracks to listen
 * to numbered in their order, however many folders the download split them across — with its cover
 * beside them. A download holding both a book to read and the same book to hear files them as one
 * book the library can open either way.
 *
 * A pack of several audiobooks — a series in one torrent — files each as a book of its own, named
 * by what its own tags say it is. So is a book sent by hand, whose release name is a poor guide to
 * which part is the title and which the author; one fetched for a request keeps the request's.
 *
 * Cue sheets, checksums and notes are left behind: a cue names the file it describes, and a track
 * filed under its place in the book no longer carries that name. Nothing is moved out of a torrent
 * that is still seeding; its files are linked or copied instead.
 *
 * @param request - What was asked for, and where its library is.
 * @param items - The book the download was fetched for.
 * @param contentPath - Where the download is, as this service sees it.
 * @param isKeepingSource - Whether the download must keep its files, as a seeding torrent must.
 * @param naming - Whether a single book is named by its own tags rather than by the request, and how
 *   tags are read.
 * @returns Where each book was filed, and the ones nothing in the download could be filed as.
 */
const fileBook = async (
  request: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'artistName'>,
  items: readonly Fileable[],
  contentPath: string,
  isKeepingSource: boolean,
  { isNamedByItsFiles = false, readTags = readSoundTags }: Naming = {},
): Promise<Filed> => {
  const files = await findDownloadedFiles(contentPath);
  const books = await booksInDownload(files, readTags);
  const isPack = books.length > 1;
  const filed = new Map<string, string>();
  const missing: string[] = [];

  for (const item of items) {
    if (books.length === 0) {
      missing.push(item.id);
      continue;
    }

    const folders: string[] = [];

    for (const book of books) {
      const byItsFiles = isPack || isNamedByItsFiles;
      const title =
        safeFileName((byItsFiles ? book.title : null) ?? '') ||
        safeFileName(item.title) ||
        safeFileName(request.title) ||
        'Book';
      const author = (byItsFiles ? book.author : null) ?? request.artistName;
      const folder = bookFolderOf(request.libraryPath, author, title);
      const { texts, tracks } = book;

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

      const pictures = files.filter(
        (file) => PICTURE.test(file.name) && isPictureOf(file, book, books),
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

      folders.push(folder);
    }

    const where = isPack ? sharedFolderOf(folders, request.libraryPath) : folders[0];

    if (where !== undefined) {
      filed.set(item.id, where);
    }
  }

  return { filed, missing };
};

export { fileBook };
