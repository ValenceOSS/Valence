import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

type AdminAreaProps = {
  panel: string;
  onPanel: (panel: string, search?: ObservabilitySearch) => void;
  historyLength?: number;
  initialJob?: string | null;
  observability?: ObservabilitySearch;
  onObservabilityChange?: (change: ObservabilitySearch) => void;
  onJobChange?: (kind: string | null) => void;
};

export type { AdminAreaProps };
