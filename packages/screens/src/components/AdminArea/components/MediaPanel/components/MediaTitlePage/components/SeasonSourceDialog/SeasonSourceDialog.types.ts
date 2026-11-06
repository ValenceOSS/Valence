import type { SeasonSource } from '@ValenceContracts/schemas/SeasonSource';

type SeasonSourceDialogProps = {
  mediaId: string;
  showName: string;
  ownExternalId: string | null;
  current: SeasonSource | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: (jobId: string | null) => void;
};

export type { SeasonSourceDialogProps };
