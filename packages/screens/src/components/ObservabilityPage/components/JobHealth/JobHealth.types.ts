import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type JobHealthProps = {
  definitions: JobDefinition[];
  search: ObservabilitySearch;
  onSearchChange: (change: ObservabilitySearch) => void;
};

export type { JobHealthProps };
