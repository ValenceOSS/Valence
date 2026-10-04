import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookSeries } from '@ValenceClient/books/gatherSeries';

type SeriesDialogProps = {
  series: BookSeries | null;
  onClose: () => void;
  onOpen: (book: Book) => void;
};

export type { SeriesDialogProps };
