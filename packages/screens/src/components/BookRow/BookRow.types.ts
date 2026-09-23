import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookSeries } from '@ValenceScreens/reading/gatherSeries';

type BookRowProps = {
  title: string;
  books: Book[];
  progress?: ReadonlyMap<string, { fraction: number; detail: string }>;
  onOpen: (book: Book) => void;
  onOpenSeries?: (series: BookSeries) => void;
  isNumbered?: boolean;
};

export type { BookRowProps };
