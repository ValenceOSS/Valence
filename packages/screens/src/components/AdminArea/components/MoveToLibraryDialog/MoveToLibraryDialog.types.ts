import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';

type MoveTarget = {
  items: readonly MediaSummary[];
  name: string;
  libraryId: string;
};

type MoveToLibraryDialogProps = {
  target: MoveTarget | null;
  libraries: readonly Library[];
  onClose: () => void;
  onMoved: (libraryId: string, jobId: string | null) => void;
};

export type { MoveTarget, MoveToLibraryDialogProps };
