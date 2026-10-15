import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ProfileLimitsDialogProps = {
  profile: ViewerProfile | null;
  accountId?: string;
  onClose: () => void;
};

export type { ProfileLimitsDialogProps };
