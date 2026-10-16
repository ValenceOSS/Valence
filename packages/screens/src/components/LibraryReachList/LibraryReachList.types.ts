import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';

type LibraryReachListProps = {
  shelves: readonly LibraryReach[];
  whose: string;
  onChange: (shelfId: string, changes: Partial<LibraryReach>) => void;
};

export type { LibraryReachListProps };
