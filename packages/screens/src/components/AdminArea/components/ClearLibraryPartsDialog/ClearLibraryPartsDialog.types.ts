import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';

type ClearLibraryPartsDialogProps = {
  definition: JobDefinition | null;
  libraries: Library[];
  onClose: () => void;
  onClear: (kind: string, libraryIds: string[], parts: LibraryPart[]) => void;
};

export type { ClearLibraryPartsDialogProps };
