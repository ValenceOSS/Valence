import type { ProfileChoice } from '@ValenceContracts/schemas/QualityProfile';

type ChooseQualityDialogProps = {
  title: string;
  choices: readonly ProfileChoice[];
  isOpen: boolean;
  isAsking: boolean;
  onChoose: (profileId: string) => void;
  onClose: () => void;
};

export type { ChooseQualityDialogProps };
