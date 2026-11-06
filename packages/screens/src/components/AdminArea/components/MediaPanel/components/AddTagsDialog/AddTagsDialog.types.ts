import type { BulkTarget, BulkTitleEditOutcome } from '@ValenceContracts/schemas/BulkTitleEdit';

type AddTagsDialogProps = {
  targets: readonly BulkTarget[] | null;
  libraryId: string;
  onClose: () => void;
  onDone: (outcome: BulkTitleEditOutcome) => void;
};

export type { AddTagsDialogProps };
