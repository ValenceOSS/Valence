import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';

type EditLiveSourceDialogProps = {
  source: LiveSource | null;
  onClose: () => void;
  onChanged: () => void;
};

export type { EditLiveSourceDialogProps };
