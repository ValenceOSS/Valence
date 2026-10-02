import type { ImportedFrom } from '@ValenceScreens/components/SetupWizard/SetupWizard.types';

type ImportFromStepProps = {
  onBack: () => void;
  onDone: (imported: ImportedFrom) => void;
};

export type { ImportFromStepProps };
