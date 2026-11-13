import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';
import type { AReaderMarks } from '@ValenceMobile/components/AReader/AReaderMarks';

type ATextReaderProps = {
  book: Book;
  chapterId: string;
  startAtFraction: number;
  next: BookChapter | null;
  onChapter: (chapterId: string) => void;
  onFraction: (fraction: number, isFinished: boolean) => void;
  onBack: () => void;
  marks?: AReaderMarks;
};

export type { ATextReaderProps };
