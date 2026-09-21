import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * Whether a file is something a library of a given kind would read, judged by its name: video and
 * the subtitles that go with it for films and programmes, tracks for music, and the formats a book
 * comes in for books.
 *
 * A name that starts with a dot is never accepted, since that is how a folder Valence keeps for
 * itself is named, and a file with no extension has nothing to be judged by.
 *
 * @param kind - The kind of library it would go in.
 * @param fileName - The file's name, or its path.
 * @returns Whether the library would read it.
 */
const isUploadableTo = (kind: LibraryKind, fileName: string): boolean => {
  const name = fileName.split('/').pop() ?? '';
  const at = name.lastIndexOf('.');

  if (name.startsWith('.') || at === -1) {
    return false;
  }

  const extension = name.slice(at + 1).toLowerCase();

  switch (kind) {
    case 'movies':
    case 'shows':
      return VIDEO_FILE_EXTENSIONS.has(extension) || TEXT_SUBTITLE_EXTENSIONS.has(extension);
    case 'music':
      return AUDIO_FILE_EXTENSIONS.has(extension);
    case 'books':
      return BOOK_FILE_FORMATS.has(extension);
  }
};

export { isUploadableTo };
