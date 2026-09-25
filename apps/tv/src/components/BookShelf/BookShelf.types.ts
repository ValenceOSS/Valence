import type { Book } from '@ValenceContracts/schemas/Book';

type BookOnAShelf = {
  book: Book;
  fraction?: number;
  detail?: string;
};

type BookShelfProps = {
  title: string;
  books: readonly BookOnAShelf[];
  onOpen: (book: Book) => void;
  onFocus?: (book: Book) => void;
};

export type { BookOnAShelf, BookShelfProps };
