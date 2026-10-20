import type { ImportedFrom } from '@ValenceScreens/components/SetupWizard/SetupWizard.types';

type DoneStepProps = {
  username: string | null;
  origins: readonly string[];
  hasCatalogueKey: boolean | null;
  libraryCount: number;
  imported: ImportedFrom | null;
  restartRequired: boolean;
  onFinish: () => void;
};

export type { DoneStepProps };
