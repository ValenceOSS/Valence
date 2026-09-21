import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type LogExplorerProps = {
  definitions: JobDefinition[];
  search: ObservabilitySearch;
  onSearchChange: (change: ObservabilitySearch) => void;
  onTraceJob: (jobId: string) => void;
  copy?: (text: string) => Promise<void>;
  download?: (name: string, text: string) => void;
};

export type { LogExplorerProps };
