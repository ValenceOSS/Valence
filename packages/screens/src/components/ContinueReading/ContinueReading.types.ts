import type { Book } from '@ValenceContracts/schemas/Book';

type ContinueReadingProps = {
  onOpen: (book: Book) => void;
};

export type { ContinueReadingProps };
