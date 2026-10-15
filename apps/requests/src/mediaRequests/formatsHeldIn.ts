import { readdir } from 'node:fs/promises';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';

/**
 * Whether a book's folder already holds it to read, to listen to, or both; neither where the
 * folder isn't there.
 *
 * @param folder - The book's folder.
 * @returns Which formats it holds.
 */
const formatsHeldIn = async (folder: string): Promise<{ text: boolean; audio: boolean }> => {
  const names = await readdir(folder).catch((): string[] => []);
  const extensions = names.map((name) => name.slice(name.lastIndexOf('.') + 1).toLowerCase());

  return {
    text: extensions.some((extension) => {
      const format = BOOK_FILE_FORMATS.get(extension);

      return format !== undefined && !isAudiobookFormat(format);
    }),
    audio: extensions.some((extension) => AUDIOBOOK_FILE_EXTENSIONS.has(extension)),
  };
};

export { formatsHeldIn };
