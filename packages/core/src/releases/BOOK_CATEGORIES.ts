import type { BookFormat } from '@ValenceContracts/schemas/MediaRequest';

const BOOK_CATEGORIES: Readonly<Record<BookFormat, readonly number[]>> = {
  ebook: [7000, 7020],
  audiobook: [3030],
};

export { BOOK_CATEGORIES };
