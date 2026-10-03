import type { ResourceSampleRecord } from '@ValenceContracts/schemas/ResourceSample';
import type { LoadRange } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle.types';

type LoadReading = Omit<ResourceSampleRecord, 'id'>;

type LoadChartProps = {
  readings: readonly LoadReading[];
  range: LoadRange;
};

export type { LoadChartProps, LoadReading };
