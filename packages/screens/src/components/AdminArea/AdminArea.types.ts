import type { ObservabilityView } from '@ValenceScreens/components/ObservabilityPage/ObservabilityPage.types';

type AdminAreaProps = {
  panel: string;
  onPanel: (panel: string) => void;
  historyLength?: number;
  initialJob?: string | null;
  initialView?: ObservabilityView;
  onJobChange?: (kind: string | null) => void;
};

export type { AdminAreaProps };
