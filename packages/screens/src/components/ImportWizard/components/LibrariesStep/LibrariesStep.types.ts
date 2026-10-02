import type { MediaImportSource } from '@ValenceContracts/schemas/MediaImport';

type LibrariesStepProps = {
  source: MediaImportSource;
  onContinue: () => void;
  onBack: () => void;
};

export type { LibrariesStepProps };
