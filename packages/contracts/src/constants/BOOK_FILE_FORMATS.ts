import type { BookFormat } from '@ValenceContracts/schemas/Book';

const BOOK_FILE_FORMATS: ReadonlyMap<string, BookFormat> = new Map<string, BookFormat>([
  ['cbz', 'cbz'],
  ['zip', 'cbz'],
  ['cbr', 'cbr'],
  ['rar', 'cbr'],
  ['pdf', 'pdf'],
  ['epub', 'epub'],
]);

export { BOOK_FILE_FORMATS };
