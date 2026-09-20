import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

type ProfileEditorProps = {
  isOpen: boolean;
  profile: QualityProfile | null;
  onClose: () => void;
  onSaved: (profile: QualityProfile) => void;
};

export type { ProfileEditorProps };
