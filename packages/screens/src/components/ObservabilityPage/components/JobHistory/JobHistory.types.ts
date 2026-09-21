import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { Job, JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type JobHistoryProps = {
  definitions: JobDefinition[];
  libraries: Library[];
  working: Job[];
  search: ObservabilitySearch;
  onSearchChange: (change: ObservabilitySearch) => void;
  onViewLogs: (jobId: string) => void;
  onTrace: (jobRunId: string) => void;
};

export type { JobHistoryProps };
