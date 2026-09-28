import type { InstallPreview } from '@ValenceContracts/schemas/Plugin';

type InstallReviewDialogProps = {
  preview: InstallPreview | null;
  onClose: () => void;
  onInstalled: () => void;
};

export type { InstallReviewDialogProps };
