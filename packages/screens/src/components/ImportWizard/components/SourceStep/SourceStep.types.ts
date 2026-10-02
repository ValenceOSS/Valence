import type { MediaImportSource } from '@ValenceContracts/schemas/MediaImport';

type SourceStepProps = {
  sources: readonly MediaImportSource[];
  onConnected: (source: MediaImportSource) => void;
  onForgotten: (sourceId: string) => void;
};

export type { SourceStepProps };
