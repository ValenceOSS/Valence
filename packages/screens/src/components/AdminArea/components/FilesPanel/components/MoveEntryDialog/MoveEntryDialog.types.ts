import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';

type MoveEntryDialogProps = {
  entry: LibraryEntry | null;
  start: string;
  onClose: () => void;
  onMove: (into: string) => void;
};

export type { MoveEntryDialogProps };
