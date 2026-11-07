import type { Book } from '@ValenceContracts/schemas/Book';

type BookLibraryProps = {
  libraryId: string;
  title: string;
  onOpen: (book: Book) => void;
};

export type { BookLibraryProps };
