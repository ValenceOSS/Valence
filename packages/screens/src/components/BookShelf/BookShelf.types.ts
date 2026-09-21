import type { Book } from '@ValenceContracts/schemas/Book';

type BookShelfProps = {
  onOpen: (book: Book) => void;
  onAddLibrary?: () => void;
  libraryId?: string | null;
};

export type { BookShelfProps };
