import type { Book } from '@ValenceContracts/schemas/Book';

type TextReaderProps = {
  book: Book;
  chapterId: string;
  startAt?: number;
  onPlaceChange?: (fraction: number, isFinished: boolean) => void;
  onClose: () => void;
};

export type { TextReaderProps };
