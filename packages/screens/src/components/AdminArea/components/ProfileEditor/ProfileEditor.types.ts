import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

type ProfileEditorProps = {
  profile: QualityProfile | null;
  onClose: () => void;
  onSaved: (profile: QualityProfile) => void;
};

export type { ProfileEditorProps };
