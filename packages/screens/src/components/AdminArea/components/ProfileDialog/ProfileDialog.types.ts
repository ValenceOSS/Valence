import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

type ProfileDialogProps = {
  isOpen: boolean;
  profile: QualityProfile | null;
  onClose: () => void;
  onSaved: (profile: QualityProfile) => void;
};

export type { ProfileDialogProps };
