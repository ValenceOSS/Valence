import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';
import type { AReaderMarks } from '@ValenceMobile/components/AReader/AReaderMarks';

type APageReaderProps = {
  book: Book;
  chapters: readonly BookChapter[];
  chapterId: string;
  startAtPage: number;
  onChapter: (chapterId: string) => void;
  onPage: (page: number, isFinished: boolean) => void;
  onBack: () => void;
  marks?: AReaderMarks;
};

type ASpreadOrTheEnd = { kind: 'spread'; pages: readonly number[] } | { kind: 'next' };

export type { APageReaderProps, ASpreadOrTheEnd };
