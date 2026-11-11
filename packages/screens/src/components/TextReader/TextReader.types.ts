import type { Book } from '@ValenceContracts/schemas/Book';
import type { ReaderMarks } from '@ValenceScreens/reading/ReaderMarks';

type TextReaderProps = {
  book: Book;
  chapterId: string;
  startAt?: number;
  onPlaceChange?: (fraction: number, isFinished: boolean) => void;
  onClose: () => void;
  marks?: ReaderMarks;
};

export type { TextReaderProps };
