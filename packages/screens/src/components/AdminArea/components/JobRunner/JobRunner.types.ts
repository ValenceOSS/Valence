import type { Job, JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';

type JobRunnerProps = {
  definitions: JobDefinition[];
  libraries: Library[];
  progress: ReadonlyMap<string, ScanEntry>;
  working: Job[];
  onRun: (kind: string, libraryIds?: string[], parts?: LibraryPart[]) => void;
  onStop: (kind: string) => void;
  onOpenSchedule: (kind: string) => void;
};

export type { JobRunnerProps };
