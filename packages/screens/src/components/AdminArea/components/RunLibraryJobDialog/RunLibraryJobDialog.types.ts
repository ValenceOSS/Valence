import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';

type RunLibraryJobDialogProps = {
  definition: JobDefinition | null;
  libraries: Library[];
  onClose: () => void;
  onRun: (kind: string, libraryIds: string[]) => void;
};

export type { RunLibraryJobDialogProps };
