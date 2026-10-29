import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

type ShareRow = {
  id: string;
  label: string;
  installs: number;
  share: number;
};

type DayCount = {
  day: string;
  installs: number;
};

type LibraryKind = keyof TelemetryReport['library'];

type MetricsStats = {
  generatedAt: string;
  activeInstalls: number;
  reportedToday: number;
  isEnoughToShow: boolean;
  trend: DayCount[];
  versions: ShareRow[];
  platforms: ShareRow[];
  architectures: ShareRow[];
  installMethods: ShareRow[];
  databases: ShareRow[];
  cpuVendors: ShareRow[];
  cores: ShareRow[];
  memory: ShareRow[];
  gpuVendors: ShareRow[];
  gpuModels: ShareRow[];
  accels: ShareRow[];
  clients: ShareRow[];
  library: Record<LibraryKind, ShareRow[]>;
};

export type { DayCount, LibraryKind, MetricsStats, ShareRow };
