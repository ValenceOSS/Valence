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
        folder: dirname(text.path),
        year: null,
      });
    }
  }

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
