import type { Book } from '@ValenceContracts/schemas/Book';

type BookTileProps = {
  book: Book;
  onPress: (book: Book) => void;
  onFocus?: (book: Book) => void;
  fraction?: number;
  detail?: string;
  width?: number;
  hasPreferredFocus?: boolean;
  isUrgent?: boolean;
};

export type { BookTileProps };
