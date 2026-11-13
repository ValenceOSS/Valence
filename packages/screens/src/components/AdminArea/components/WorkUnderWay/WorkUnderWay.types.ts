import type { Job, JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';

type WorkUnderWayProps = {
  working: readonly Job[];
  progress: ReadonlyMap<string, ScanEntry>;
  definitions: readonly JobDefinition[];
  libraries: readonly Library[];
};

export type { WorkUnderWayProps };
