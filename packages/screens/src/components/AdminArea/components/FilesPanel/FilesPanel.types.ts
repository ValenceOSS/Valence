import type { Library } from '@ValenceContracts/schemas/Library';

type FilesPanelProps = {
  libraries: readonly Library[];
  mayDelete: boolean;
  openAt?: string | null;
  onChanged: () => void;
  onScan: (libraryId: string) => void;
};

export type { FilesPanelProps };
