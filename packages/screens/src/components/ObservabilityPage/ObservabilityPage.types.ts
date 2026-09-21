import type {
  JobDefinition,
  JobTrigger,
  Monitor,
  ScheduleTrigger,
} from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';

type ObservabilityView = 'logs' | 'jobs' | 'health' | 'run';

type ObservabilityPageProps = {
  definitions: JobDefinition[];
  libraries: Library[];
  progress: ReadonlyMap<string, ScanEntry>;
  monitor: Monitor | null;
  viewingJobKind: string | null;
  schedules: Map<string, JobTrigger[]>;
  schedulesTimezone?: string | null;
  initialView?: ObservabilityView;
  onRun: (kind: string, libraryIds?: string[], parts?: LibraryPart[]) => void;
  onStop: (kind: string) => void;
  onOpenSchedule: (kind: string) => void;
  onCloseSchedule: () => void;
  onAddTrigger: (kind: string, trigger: ScheduleTrigger) => void;
  onRemoveTrigger: (kind: string, triggerId: string) => void;
};

export type { ObservabilityPageProps, ObservabilityView };
