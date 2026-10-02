import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';

type ImportStepProps = {
  started: MediaImportRun;
  onFinished: (run: MediaImportRun) => void;
};

export type { ImportStepProps };
