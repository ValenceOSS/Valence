import { basename, extname } from 'node:path';
import { booksInDownload } from '@ValenceRequests/mediaRequests/booksInDownload';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { isSameBook } from '@ValenceRequests/mediaRequests/isSameBook';
import { partsOfAudiobook } from '@ValenceRequests/mediaRequests/partsOfAudiobook';
import { readSoundTags } from '@ValenceRequests/mediaRequests/readSoundTags';
import type { SoundTags } from '@ValenceRequests/mediaRequests/readSoundTags';

/**
 * How many parts an audiobook download holds, and which are missing, from the names of its audio
 * files: in a pack of several books, those of the book asked for, as each of a pack's books is one
 * book rather than a part of one. Nothing where it holds no audio of that book.
 *
 * @param contentPath - Where the download is.
 * @param title - The book asked for, which is found among a pack's books by its title.
 * @param readTags - How a track's tags are read, which tell a pack's books apart.
 * @returns Its parts, or null where it has none.
 */
const partsInDownload = async (
  contentPath: string,
  title: string,
  readTags: (path: string) => Promise<SoundTags | null> = readSoundTags,
): Promise<{ count: number; missing: number[] } | null> => {
  const books = await booksInDownload(await findDownloadedFiles(contentPath), readTags);
  const book =
    books.length === 1
      ? books[0]
      : books.find((one) => one.title !== null && isSameBook(one.title, title));

  return book === undefined || book.tracks.length === 0
    ? null
    : partsOfAudiobook(book.tracks.map((track) => basename(track.name, extname(track.name))));
};

export { partsInDownload };
