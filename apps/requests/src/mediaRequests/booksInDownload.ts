import { basename, dirname, extname } from 'node:path';
import { audiobookTitleOf } from '@ValenceContracts/functions/audiobookTitleOf';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import { bookFolderInDownload } from '@ValenceRequests/mediaRequests/bookFolderInDownload';
import { extensionOf } from '@ValenceRequests/mediaRequests/extensionOf';
import { titleFromFolderName } from '@ValenceRequests/mediaRequests/seriesOfPack';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { SoundTags } from '@ValenceRequests/mediaRequests/readSoundTags';

type BookInDownload = {
  texts: DownloadedFile[];
  tracks: DownloadedFile[];
  title: string | null;
  author: string | null;
  folder: string;
  year: number | null;
};

const IN_ORDER = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const MOST_EDITIONS_OF_ONE_BOOK = 2;

const MOST_BOOKS_IN_A_PACK = 100;

const ONLY_A_HASH = /^[0-9a-f]{32}$/i;

const NUMBERED = /(?:^|\D)\d{1,3}(?:\D|$)/;

/**
 * Books' files gathered by their names, so the same book as an epub and a mobi is one book.
 *
 * @param files - The files.
 * @returns Each name's files, in the order the names first come.
 */
const byName = (files: readonly DownloadedFile[]): DownloadedFile[][] => {
  const named = new Map<string, DownloadedFile[]>();

  for (const file of files) {
    const name = basename(file.name, extname(file.name)).toLowerCase();

    named.set(name, [...(named.get(name) ?? []), file]);
  }

  return [...named.values()];
};

/**
 * The books a download holds. Most hold one; a pack holds several, each audiobook told apart by the
 * album its tracks are tagged with, or by its folder where they are not tagged, a disc's folder
 * being part of the book around it. Text to read goes with the audiobook in its own folder, so a
 * book to read and the same book to hear are still one book; where there is no audiobook, all the
 * text is one book, as it is several formats of it. A file named by nothing but a hash — a whole
 * collection's worth of them, fetched where one book was wanted — is not taken for a book, and text
 * by more names than any pack of one series would hold is taken for none.
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

    return (
      format !== undefined &&
      !isAudiobookFormat(format) &&
      !ONLY_A_HASH.test(basename(file.name, extname(file.name)))
    );
  });
  const tracks = files
    .filter((file) => AUDIOBOOK_FILE_EXTENSIONS.has(extensionOf(file.name)))
    .toSorted((left, right) => IN_ORDER.compare(left.path, right.path));
  const heard = new Map<string, BookInDownload>();

  for (const track of tracks) {
    const tags = await readTags(track.path);
    const title = tags === null ? null : audiobookTitleOf(tags);
    const folder = bookFolderInDownload(track);
    const key = `${folder}\u0000${(tags?.album ?? '').toLowerCase()}`;
    const book: BookInDownload = heard.get(key) ?? {
      folder,
      texts: [],
      tracks: [],
      title,
      author: tags?.author ?? null,
      year: tags?.year ?? null,
    };

    book.tracks.push(track);
    heard.set(key, book);
  }

  const books = [...heard.values()];

  const named = byName(texts);

  if (books.length === 0 && named.length > MOST_BOOKS_IN_A_PACK) {
    return [];
  }

  if (
    books.length === 0 &&
    named.length > MOST_EDITIONS_OF_ONE_BOOK &&
    named.every((group) => NUMBERED.test(group[0]?.name ?? ''))
  ) {
    return named.flatMap((group) => {
      const [first] = group;

      return first === undefined
        ? []
        : [
            {
              texts: group,
              tracks: [],
              title: titleFromFolderName(basename(first.name, extname(first.name))),
              author: null,
              folder: dirname(first.path),
              year: null,
            },
          ];
    });
  }

  if (books.length <= 1) {
    return books.length === 0 && texts.length === 0
      ? []
      : [
          {
            texts,
            tracks,
            title: books[0]?.title ?? null,
            author: books[0]?.author ?? null,
            folder: books[0]?.folder ?? dirname(texts[0]?.path ?? ''),
            year: books[0]?.year ?? null,
          },
        ];
  }

  const lone: DownloadedFile[] = [];

  for (const text of texts) {
    const beside = books.filter((book) => book.folder === bookFolderInDownload(text));

    if (beside.length === 1 && beside[0] !== undefined) {
      beside[0].texts.push(text);
    } else {
      lone.push(text);
    }
  }

  const alone: BookInDownload[] = byName(lone).flatMap((group) => {
    const [first] = group;

    return first === undefined
      ? []
      : [
          {
            texts: group,
            tracks: [],
            title: basename(first.name, extname(first.name)),
            author: null,
            folder: dirname(first.path),
            year: null,
          },
        ];
  });

  return [
    ...books.map((book) => ({
      ...book,
      title: book.title ?? titleFromFolderName(basename(book.folder)),
    })),
    ...alone,
  ];
};

export { booksInDownload };
export type { BookInDownload };
