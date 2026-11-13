import type { ReactNode } from 'react';
import type { DescribedBookmark } from '@ValenceClient/books/describeBookmark';

type AReaderPlace = {
  id: string;
  label: string;
  depth: number;
  isHere: boolean;
};

type AReaderSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  look?: ReactNode;
  settings: ReactNode;
  placesAre: string;
  places: readonly AReaderPlace[];
  onPlace: (id: string) => void;
  bookmarks?: readonly DescribedBookmark[];
  onBookmark?: (bookmarkId: string) => void;
  onRemoveBookmarks?: (bookmarkIds: readonly string[]) => void;
};

export type { AReaderPlace, AReaderSheetProps };
