import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';

type LiveGuideDialogProps = {
  source: LiveSource | null;
  onClose: () => void;
  onChanged: () => void;
};

export type { LiveGuideDialogProps };
