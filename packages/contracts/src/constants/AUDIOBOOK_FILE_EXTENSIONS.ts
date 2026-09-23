import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';

const AUDIOBOOK_FILE_EXTENSIONS: ReadonlySet<string> = new Set(
  [...BOOK_FILE_FORMATS].flatMap(([extension, format]) =>
    isAudiobookFormat(format) ? [extension] : [],
  ),
);

export { AUDIOBOOK_FILE_EXTENSIONS };
