import type { Concern } from '@ValenceScreens/components/AdminArea/collectConcerns';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

type ConcernsBannerProps = {
  concerns: Concern[];
  onOpenPanel: (panel: string, search?: ObservabilitySearch) => void;
  onDismiss: (concern: Concern) => void;
};

export type { ConcernsBannerProps };
