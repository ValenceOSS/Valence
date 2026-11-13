import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';
import type { ReaderMarks } from '@ValenceScreens/reading/ReaderMarks';

type PageReaderProps = {
  book: Book;
  chapters: BookChapter[];
  chapterId: string;
  startAtPage?: number;
  onChapterChange: (chapterId: string) => void;
  onPageChange?: (page: number, isFinished: boolean) => void;
  onClose: () => void;
  marks?: ReaderMarks;
};

export type { PageReaderProps };
