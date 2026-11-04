import type { Library } from '@ValenceContracts/schemas/Library';

type FolderViewProps = {
  libraries: readonly Library[];
  mayDelete: boolean;
  openAt?: string | null;
  onChanged: () => void;
  onScan: (libraryId: string) => void;
  onOpen?: (path: string | null) => void;
};

export type { FolderViewProps };
