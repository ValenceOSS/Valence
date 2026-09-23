import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';

type APageReaderProps = {
  book: Book;
  chapters: readonly BookChapter[];
  chapterId: string;
  startAtPage: number;
  onChapter: (chapterId: string) => void;
  onPage: (page: number, isFinished: boolean) => void;
  onBack: () => void;
};

type ASpreadOrTheEnd = { kind: 'spread'; pages: readonly number[] } | { kind: 'next' };

export type { APageReaderProps, ASpreadOrTheEnd };
