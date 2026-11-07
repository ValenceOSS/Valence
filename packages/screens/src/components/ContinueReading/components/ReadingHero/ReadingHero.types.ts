import type { Book, BookReading } from '@ValenceContracts/schemas/Book';

type ReadingHeroProps = {
  reading: BookReading;
  onOpen: (book: Book) => void;
};

export type { ReadingHeroProps };
