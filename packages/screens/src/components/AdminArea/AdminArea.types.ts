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
  mediaTitle?: string | null;
  onMediaTitle?: (id: string | null) => void;
  webhook?: string | null;
  onWebhook?: (id: string | null) => void;
  linkedServer?: string | null;
  onLinkedServer?: (id: string | null) => void;
  onCatalogue?: (address: CatalogueAddress) => void;
};

export type { AdminAreaProps };
