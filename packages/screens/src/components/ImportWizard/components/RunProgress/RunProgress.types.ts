import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';

type RunProgressProps = {
  run: MediaImportRun;
  onCancel: () => void;
};

export type { RunProgressProps };
