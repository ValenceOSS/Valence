import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

type TimeRangeMenuProps = {
  search: ObservabilitySearch;
  onSearchChange: (change: ObservabilitySearch) => void;
};

export type { TimeRangeMenuProps };
