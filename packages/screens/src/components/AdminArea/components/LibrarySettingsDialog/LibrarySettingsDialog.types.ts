import type { Library } from '@ValenceContracts/schemas/Library';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

type LibrarySettingsDialogProps = {
  profiles?: readonly QualityProfile[];
  library: Library | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (library: Library) => void;
  onRegenerate: (libraryId: string) => void;
};

export type { LibrarySettingsDialogProps };
