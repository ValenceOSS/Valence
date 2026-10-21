import type { ActiveSession, AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { OverviewReading } from './OverviewReading.types';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LoadReading } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadChart/LoadChart.types';

type OverviewPanelProps = {
  overview: AdminOverview | null;
  monitor: Monitor | null;
  libraries: Library[];
  sessions: ActiveSession[];
  stillReading?: OverviewReading;
  readings: readonly LoadReading[];
  onOpenPanel: (panel: string) => void;
};

export type { OverviewPanelProps };
