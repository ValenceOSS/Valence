import type { Book } from '@ValenceContracts/schemas/Book';

type BookDialogProps = {
  bookId: string | null;
  isKept: boolean;
  onClose: () => void;
  onRead: (book: Book) => void;
  onToggleKept: (book: Book) => void;
  onRate: (book: Book, stars: number | null) => void;
  onShare?: (book: Book) => void;
};

export type { BookDialogProps };
