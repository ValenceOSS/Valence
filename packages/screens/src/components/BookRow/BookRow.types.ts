import type { Book } from '@ValenceContracts/schemas/Book';

type BookRowProps = {
  title: string;
  books: Book[];
  progress?: ReadonlyMap<string, { fraction: number; detail: string }>;
  onOpen: (book: Book) => void;
};

export type { BookRowProps };
