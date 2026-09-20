import type { Job, JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type JobHistoryProps = {
  definitions: JobDefinition[];
  working: Job[];
  onViewLogs: (jobId: string) => void;
};

export type { JobHistoryProps };
