import type { View } from 'react-native';
import type { Book } from '@ValenceContracts/schemas/Book';

type BooksProps = {
  libraryIds: readonly string[];
  onOpen: (book: Book) => void;
  onFeature: (path: string | null) => void;
  upTo: View | null;
};

export type { BooksProps };
