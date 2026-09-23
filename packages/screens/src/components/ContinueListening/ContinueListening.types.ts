import type { Book } from '@ValenceContracts/schemas/Book';

type ContinueListeningProps = {
  onOpen: (book: Book) => void;
};

export type { ContinueListeningProps };
