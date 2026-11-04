import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';
import type { Library } from '@ValenceContracts/schemas/Library';

type FolderViewProps = {
  libraries: readonly Library[];
  mayDelete: boolean;
  openAt?: string | null;
  onChanged: () => void;
  onScan: (libraryId: string) => void;
  onOpen?: (path: string | null) => void;
  onOpenTitle?: (titleId: string) => void;
  root?: string | null;
  search?: string;
  keeps?: (entry: LibraryEntry) => boolean;
  columns?: readonly DataTableColumn<LibraryEntry>[];
  actionsOf?: (entry: LibraryEntry) => ActionMenuItem[][];
  hidesTitles?: boolean;
};

export type { FolderViewProps };
