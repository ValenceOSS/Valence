import type { CatalogueAddress } from '@ValenceScreens/components/AdminArea/components/CataloguePanel/CatalogueAddress.types';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

type AdminAreaProps = {
  panel: string;
  onPanel: (panel: string, search?: ObservabilitySearch) => void;
  historyLength?: number;
  initialJob?: string | null;
  observability?: ObservabilitySearch;
  onObservabilityChange?: (change: ObservabilitySearch) => void;
  onJobChange?: (kind: string | null) => void;
  folder?: string | null;
  onOpenFolder?: (path: string) => void;
  catalogue?: CatalogueAddress;
  onCatalogue?: (address: CatalogueAddress) => void;
};

export type { AdminAreaProps };
