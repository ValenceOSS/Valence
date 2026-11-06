import type { BulkTarget, BulkTitleEditOutcome } from '@ValenceContracts/schemas/BulkTitleEdit';

type BulkEditDialogProps = {
  targets: readonly BulkTarget[] | null;
  hasShows: boolean;
  libraryId: string;
  onClose: () => void;
  onDone: (outcome: BulkTitleEditOutcome, appliesTo: 'titles' | 'episodes') => void;
};

export type { BulkEditDialogProps };
