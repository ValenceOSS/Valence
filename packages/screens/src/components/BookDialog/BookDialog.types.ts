import type { Book, BookDetail } from '@ValenceContracts/schemas/Book';

type BookDialogProps = {
  bookId: string | null;
  isKept: boolean;
  onClose: () => void;
  onRead: (book: Book) => void;
  onReadChapter?: (book: Book, chapterId: string) => void;
  onListen?: (detail: BookDetail) => void;
  onToggleKept: (book: Book) => void;
  onRate: (book: Book, stars: number | null) => void;
  onShare?: (book: Book) => void;
  onOpenBook: (bookId: string) => void;
  onAsk?: (asking: string) => void;
};

export type { BookDialogProps };
