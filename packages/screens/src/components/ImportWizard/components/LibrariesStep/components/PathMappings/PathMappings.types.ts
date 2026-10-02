import type { PathMapping } from '@ValenceContracts/schemas/MediaImport';

type PathMappingsProps = {
  sourceName: string;
  mappings: readonly PathMapping[];
  isSaving: boolean;
  onSave: (mappings: PathMapping[]) => void;
};

export type { PathMappingsProps };
