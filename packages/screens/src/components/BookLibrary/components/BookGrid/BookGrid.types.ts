import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';

type BookGridProps = {
  books: readonly Book[];
  label: string;
  size?: MediaGridSize;
  onOpen: (book: Book) => void;
};

export type { BookGridProps };
