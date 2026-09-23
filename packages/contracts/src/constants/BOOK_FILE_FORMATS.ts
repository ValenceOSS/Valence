import type { BookFormat } from '@ValenceContracts/schemas/Book';

const BOOK_FILE_FORMATS: ReadonlyMap<string, BookFormat> = new Map<string, BookFormat>([
  ['cbz', 'cbz'],
  ['zip', 'cbz'],
  ['cbr', 'cbr'],
  ['rar', 'cbr'],
  ['pdf', 'pdf'],
  ['epub', 'epub'],
  ['m4b', 'm4b'],
  ['m4a', 'm4a'],
  ['mp3', 'mp3'],
  ['aac', 'aac'],
  ['ogg', 'ogg'],
  ['oga', 'ogg'],
  ['opus', 'opus'],
  ['flac', 'flac'],
]);

export { BOOK_FILE_FORMATS };
