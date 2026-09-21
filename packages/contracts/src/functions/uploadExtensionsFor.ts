import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * The extensions of the files a library of a given kind reads: video and the subtitles that go with
 * it for films and programmes, tracks for music, and the formats a book comes in for books.
 *
 * @param kind - The kind of library.
 * @returns The extensions, lower case and without their dot, in alphabetical order.
 */
const uploadExtensionsFor = (kind: LibraryKind): readonly string[] => {
  switch (kind) {
    case 'movies':
    case 'shows':
      return [...VIDEO_FILE_EXTENSIONS, ...TEXT_SUBTITLE_EXTENSIONS].toSorted();
    case 'music':
      return [...AUDIO_FILE_EXTENSIONS].toSorted();
    case 'books':
      return [...BOOK_FILE_FORMATS.keys()].toSorted();
  }
};

export { uploadExtensionsFor };
