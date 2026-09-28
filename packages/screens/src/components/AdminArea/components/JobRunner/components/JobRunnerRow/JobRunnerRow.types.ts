import type { JobDefinition, JobTrigger } from '@ValenceClient/admin/fetchAdmin';
import type { ProgressSummary } from '@ValenceScreens/components/AdminArea/components/JobRunner/summariseProgress';

type JobRunnerRowProps = {
  definition: JobDefinition;
  triggers: JobTrigger[];
  nextRunAt: number | null;
  now: number;
  summary: ProgressSummary | null;
  isRunBlocked: boolean;
  onRun: (definition: JobDefinition) => void;
  onStop: (definition: JobDefinition) => void;
  onWatch: (definition: JobDefinition) => void;
  onOpenSchedule: (kind: string) => void;
};

export type { JobRunnerRowProps };
