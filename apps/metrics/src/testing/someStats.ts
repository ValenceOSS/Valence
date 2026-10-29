import type { MetricsStats, ShareRow } from '@ValenceMetrics/stats/MetricsStats';

const A_ROW: ShareRow = { id: 'linux', label: 'Linux', installs: 60, share: 0.75 };

/**
 * Figures as the page is handed them, with whatever a test wants changed.
 *
 * @param over - What to change.
 * @returns The figures.
 */
const someStats = (over: Partial<MetricsStats> = {}): MetricsStats => ({
  generatedAt: '2026-10-29T12:00:00.000Z',
  activeInstalls: 80,
  reportedToday: 71,
  isEnoughToShow: true,
  trend: [
    { day: '2026-10-28', installs: 78 },
    { day: '2026-10-29', installs: 80 },
  ],
  versions: [{ id: '0.9.0', label: '0.9.0', installs: 50, share: 0.625 }],
  platforms: [A_ROW],
  architectures: [A_ROW],
  installMethods: [A_ROW],
  databases: [A_ROW],
  cpuVendors: [A_ROW],
  cores: [A_ROW],
  memory: [A_ROW],
  gpuVendors: [A_ROW],
  gpuModels: [A_ROW],
  accels: [A_ROW],
  clients: [A_ROW],
  library: { films: [A_ROW], episodes: [A_ROW], tracks: [A_ROW], books: [A_ROW] },
  ...over,
});

export { someStats };
