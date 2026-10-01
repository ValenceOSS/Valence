import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { Job } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';

type LibrariesPanelProps = {
  profiles?: readonly QualityProfile[];
  arrApps?: readonly ArrApp[];
  isUnreachable?: boolean;
  libraries: Library[];
  progress: ReadonlyMap<string, ScanEntry>;
  working: Job[];
  isScanningAll: boolean;
  isResettingAll: boolean;
  onScan: (libraryId: string, force?: boolean) => void;
  onScanAll: () => void;
  onResetAll: () => void;
  onRegeneratePreviews: (libraryId: string) => void;
  onLibraryCreated: (library: Library) => void;
  onLibraryUpdated: (library: Library) => void;
  onLibraryDeleted: (libraryId: string) => void;
  onOpenFolder: (path: string) => void;
  hasCatalogueKey?: boolean;
  isSetupHidden?: boolean;
  onOpenSettings?: () => void;
  onHideSetup?: () => void;
};

export type { LibrariesPanelProps };
