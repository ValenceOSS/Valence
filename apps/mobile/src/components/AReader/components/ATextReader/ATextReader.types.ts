import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';

type ATextReaderProps = {
  book: Book;
  chapterId: string;
  startAtFraction: number;
  next: BookChapter | null;
  onChapter: (chapterId: string) => void;
  onFraction: (fraction: number, isFinished: boolean) => void;
  onBack: () => void;
};

export type { ATextReaderProps };
