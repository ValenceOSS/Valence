import type { Library } from '@ValenceContracts/schemas/Library';
import type { Job, JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type JobHistoryProps = {
  definitions: JobDefinition[];
  libraries: Library[];
  working: Job[];
  onViewLogs: (jobId: string) => void;
};

export type { JobHistoryProps };
