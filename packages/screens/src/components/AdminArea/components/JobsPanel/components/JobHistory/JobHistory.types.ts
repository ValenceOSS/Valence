import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type JobHistoryProps = {
  definitions: JobDefinition[];
  onViewLogs: (jobId: string) => void;
};

export type { JobHistoryProps };
