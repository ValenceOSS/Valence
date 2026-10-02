import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';

type SetupLinksStepProps = {
  run: MediaImportRun;
  onFinish: () => void;
};

export type { SetupLinksStepProps };
