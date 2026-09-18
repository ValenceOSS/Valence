import type { Book } from '@ValenceContracts/schemas/Book';

type GuestReaderProps = {
  book: Book;
  onClose: () => void;
};

export type { GuestReaderProps };
