/* oxlint-disable valence/no-hard-coded-strings -- file and folder names on disk, which media servers read in English */
import { basename, dirname, extname, join } from 'node:path';
import { access, writeFile } from 'node:fs/promises';
import { bookMetadataOf } from '@ValenceRequests/mediaRequests/bookMetadataOf';
import { fetchPicture } from '@ValenceRequests/mediaRequests/fetchPicture';
import { findBookFolder } from '@ValenceRequests/mediaRequests/findBookFolder';
import { isSameBook } from '@ValenceRequests/mediaRequests/isSameBook';
import { partsOfAudiobook } from '@ValenceRequests/mediaRequests/partsOfAudiobook';
import { formatsHeldIn } from '@ValenceRequests/mediaRequests/formatsHeldIn';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { placeFile } from '@ValenceRequests/mediaRequests/placeFile';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import { placesInSeries, seriesNameOf } from '@ValenceRequests/mediaRequests/seriesOfPack';
import { bookFolderInDownload } from '@ValenceRequests/mediaRequests/bookFolderInDownload';
import { booksInDownload } from '@ValenceRequests/mediaRequests/booksInDownload';
import { extensionOf } from '@ValenceRequests/mediaRequests/extensionOf';
import { readSoundTags } from '@ValenceRequests/mediaRequests/readSoundTags';
import type { BookInDownload } from '@ValenceRequests/mediaRequests/booksInDownload';
import type { SoundTags } from '@ValenceRequests/mediaRequests/readSoundTags';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { BookFormat } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Fileable = Pick<RequestItemRecord, 'id' | 'title'> &
  Partial<Pick<RequestItemRecord, 'format' | 'narration'>>;

type ShelvedBook = {
  title: string;
  folder: string;
  formats: BookFormat[];
  parts: { count: number; missing: number[] };
};

type Filed = {
  filed: ReadonlyMap<string, string>;
  missing: readonly string[];
  books?: readonly ShelvedBook[];
};

type Naming = {
  isNamedByItsFiles?: boolean;
  readTags?: (path: string) => Promise<SoundTags | null>;
  fetchCover?: (url: string) => Promise<Uint8Array | null>;
};

const COVER = /^(cover|folder|front|poster)\.(jpe?g|png)$/i;

/**
 * Writes a file beside a book where none of that name is there yet, so what the library already
 * keeps there is never replaced.
 *
 * @param path - Where.
 * @param made - What goes in it, or nothing where there is nothing to write.
 */
const keepNew = async (
  path: string,
  made: () => string | Promise<Uint8Array | null>,
): Promise<void> => {
  if (
    await access(path).then(
      () => true,
      () => false,
    )
  ) {
    return;
  }

  const content = await made();

  if (content !== null) {
    await writeFile(path, content);
  }
};

const PICTURE = /\.(jpe?g|png)$/i;

const LEADING_NUMBER = /^\s*\d{1,3}[\s.\-_]+/;

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
 * by what its own tags say it is, into its series in its author's folder and at its place there,
 * `Author/Series/2 - Title`, as the library reads a series, the series named as the request knows
 * it where it does. Any book the library already has — the book to read, arriving after the book to
 * hear — joins the folder it is kept in, so the library opens it either way, and a pack leaves out
 * a format that folder already holds. Every book a pack holds is said, with where it went, the
 * formats it came in and its parts; the book it was fetched for is filed where its own folder is. A
 * single book is named by the request, except one sent by hand, whose release name is a poor guide
 * to which part is the title and which the author, and which is named by its own tags.
 *
 * A single book gets a `metadata.opf` beside it, saying its title, author, narrators, year, blurb,
 * series and Open Library id, and a `cover.jpg` from Open Library where the download brought no
 * cover — each only where the folder has none of its own yet.
 *
 * Cue sheets, checksums and notes are left behind: a cue names the file it describes, and a track
 * filed under its place in the book no longer carries that name. Nothing is moved out of a torrent
 * that is still seeding; its files are linked or copied instead.
 *
 * @param request - What was asked for, and where its library is.
 * @param items - The book the download was fetched for.
 * @param contentPath - Where the download is, as this service sees it.
 * @param isKeepingSource - Whether the download must keep its files, as a seeding torrent must.
 * @param naming - Whether a single book is named by its own tags rather than by the request, how
 *   tags are read, and how a cover is fetched where the download brought none.
 * @returns Where each book was filed, and the ones nothing in the download could be filed as.
 */
const fileBook = async (
  request: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'artistName'> &
    Partial<
      Pick<MediaRequestRecord, 'year' | 'overview' | 'openLibraryId' | 'narrations' | 'posterUrl'>
    >,
  items: readonly Fileable[],
  contentPath: string,
  isKeepingSource: boolean,
  { isNamedByItsFiles = false, readTags = readSoundTags, fetchCover = fetchPicture }: Naming = {},
): Promise<Filed> => {
  const files = await findDownloadedFiles(contentPath);
  const books = await booksInDownload(files, readTags);
  const isPack = books.length > 1;
  const series = isPack
    ? ((request.narrations ?? []).find((narration) => narration.series !== null)?.series ??
      seriesNameOf(
        [basename(contentPath), request.title],
        [
          ...new Set([
            ...books.flatMap((book) => (book.author === null ? [] : [book.author])),
            ...(request.artistName === null ? [] : [request.artistName]),
          ]),
        ],
      ))
    : null;
  const places = placesInSeries(
    books.map((book) => ({
      names: [basename(book.folder), ...[...book.tracks, ...book.texts].map((file) => file.name)],
      year: book.year,
    })),
  );
  const filed = new Map<string, string>();
  const missing: string[] = [];
  const shelved = new Map<string, ShelvedBook>();

  for (const item of items) {
    const isItsFormat = (book: BookInDownload) =>
      item.format === undefined ||
      (item.format === 'audiobook' ? book.tracks : book.texts).length > 0;

    if (!books.some(isItsFormat)) {
      missing.push(item.id);
      continue;
    }

    const folders: string[] = [];

    for (const [at, book] of books.entries()) {
      const byItsFiles = isPack || isNamedByItsFiles;
      const title =
        safeFileName((byItsFiles ? book.title : null) ?? '') ||
        safeFileName(item.title) ||
        safeFileName(request.title) ||
        'Book';
      const author = (byItsFiles ? book.author : null) ?? request.artistName;
      const placed =
        series === null
          ? bookFolderOf(request.libraryPath, author, title)
          : join(
              bookFolderOf(request.libraryPath, author, series),
              `${(places[at] ?? at + 1).toString()} - ${title}`,
            );
      const folder = (await findBookFolder(request.libraryPath, author, title)) ?? placed;
      const held = isPack ? await formatsHeldIn(folder) : { text: false, audio: false };
      const texts = held.text ? [] : book.texts;
      const tracks = held.audio ? [] : book.tracks;

      shelved.set(folder, {
        title,
        folder,
        formats: [
          ...(book.texts.length > 0 ? (['ebook'] as const) : []),
          ...(book.tracks.length > 0 ? (['audiobook'] as const) : []),
        ],
        parts:
          book.tracks.length === 0
            ? { count: 0, missing: [] }
            : partsOfAudiobook(
                book.tracks.map((track) => basename(track.name, extname(track.name))),
              ),
      });

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

      if (!isPack) {
        const narration = (request.narrations ?? []).find(
          (one) => item.format === 'audiobook' && one.asin === item.narration,
        );

        await keepNew(join(folder, 'metadata.opf'), () =>
          bookMetadataOf({
            title: request.title,
            artistName: author,
            year: request.year ?? null,
            overview: request.overview ?? null,
            openLibraryId: request.openLibraryId ?? null,
            narrators: narration?.narrators ?? [],
            series: narration?.series ?? null,
          }),
        );

        const posterUrl = request.posterUrl ?? null;

        if (cover === undefined && posterUrl !== null && posterUrl.startsWith('https://')) {
          await keepNew(join(folder, 'cover.jpg'), () =>
            fetchCover(posterUrl.replace(/-M\.jpg$/, '-L.jpg')),
          );
        }
      }

      folders.push(folder);
    }

    const own = isPack
      ? books.findIndex((book) => book.title !== null && isSameBook(book.title, request.title))
      : -1;
    const where =
      own >= 0 ? folders[own] : isPack ? sharedFolderOf(folders, request.libraryPath) : folders[0];

    if (where !== undefined) {
      filed.set(item.id, where);
    }
  }

  return {
    filed,
    missing,
    books: [...shelved.values()],
  };
};

export { fileBook };
export type { ShelvedBook };
