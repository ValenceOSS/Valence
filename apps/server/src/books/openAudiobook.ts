import { parseFile } from 'music-metadata';
import { audiobookFromMetadata } from './audiobookFromMetadata';
import type { ListenBook } from './BookFile';

/**
 * Opens an audiobook's file — an m4b holding a whole book, or one track of many — for its length,
 * its chapter marks and its tags.
 *
 * @param path - Where the file is.
 * @returns The book, or nothing where the file could not be read as sound.
 */
const openAudiobook = async (path: string): Promise<ListenBook | null> => {
  const meta = await parseFile(path, { duration: true, includeChapters: true }).catch(() => null);

  return meta === null ? null : audiobookFromMetadata(meta);
};

export { openAudiobook };
