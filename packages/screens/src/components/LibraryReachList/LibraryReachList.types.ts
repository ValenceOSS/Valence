import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type LibraryReachListProps<Shelf extends LibraryReach> = {
  shelves: readonly Shelf[];
  whose: string;
  onChange: (shelf: Shelf, changes: Partial<LibraryReach>) => void;
  agesFor?: (shelf: Shelf) => MenuOption[];
  changing?: string | null;
};

export type { LibraryReachListProps };
