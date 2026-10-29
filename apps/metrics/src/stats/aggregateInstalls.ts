import {
  TELEMETRY_COUNT_BUCKETS,
  TELEMETRY_MEMORY_BUCKETS,
} from '@ValenceContracts/schemas/TelemetryReport';
import { CLIENT_KINDS } from '@ValenceContracts/schemas/ClientKind';
import { A_DAY } from './A_DAY';
import { CORE_BUCKETS, coreBucketOf } from './coreBucketOf';
import { countsOf } from './countsOf';
import { cpuVendorOf } from './cpuVendorOf';
import { labelOf } from './labelOf';
import { FEWEST_SERVERS_SHOWN, shareOf } from './shareOf';
import type { InstallSummary } from './InstallSummary';
import type { DayCount, LibraryKind, MetricsStats, ShareRow } from './MetricsStats';
import type { LabelKind } from './labelOf';

const TOP_GPU_MODELS = 10;

type Aggregated = {
  installs: readonly InstallSummary[];
  trend: readonly DayCount[];
  now: Date;
};

/**
 * Sums up every install that reported in the last thirty days into the figures the page shows,
 * shown only once at least three servers have reported.
 *
 * @param aggregated - The installs, the trend of how many there were, and when this is.
 * @returns The figures.
 */
const aggregateInstalls = ({ installs, trend, now }: Aggregated): MetricsStats => {
  const total = installs.length;
  const isEnoughToShow = total >= FEWEST_SERVERS_SHOWN;

  const share = (
    kind: LabelKind | null,
    groupsOf: (install: InstallSummary) => readonly string[],
    order?: readonly string[],
    limit?: number,
  ): ShareRow[] =>
    isEnoughToShow
      ? shareOf({
          counts: countsOf(installs, groupsOf),
          total,
          labelOf: (id) => (kind === null ? id : labelOf(kind, id)),
          ...(order === undefined ? {} : { order }),
          ...(limit === undefined ? {} : { limit }),
        })
      : [];

  const shareOfLibrary = (kind: LibraryKind): ShareRow[] =>
    share('count', ({ library }) => [library[kind]], TELEMETRY_COUNT_BUCKETS);

  return {
    generatedAt: now.toISOString(),
    activeInstalls: total,
    reportedToday: installs.filter(({ lastSeen }) => now.getTime() - lastSeen.getTime() < A_DAY)
      .length,
    isEnoughToShow,
    trend: [...trend],
    versions: share(null, ({ version }) => [version]),
    platforms: share('platform', ({ platform }) => [platform]),
    architectures: share('arch', ({ arch }) => [arch]),
    installMethods: share('installMethod', ({ installMethod }) => [installMethod]),
    databases: share('database', ({ database }) => [database]),
    cpuVendors: share('cpuVendor', ({ cpuModel }) => [cpuVendorOf(cpuModel)]),
    cores: share('cores', ({ cores }) => [coreBucketOf(cores)], CORE_BUCKETS),
    memory: share('memory', ({ memoryGb }) => [memoryGb], TELEMETRY_MEMORY_BUCKETS),
    gpuVendors: share('gpuVendor', ({ gpus }) =>
      gpus.length === 0 ? ['none'] : gpus.map(({ vendor }) => vendor),
    ),
    gpuModels: share(
      null,
      ({ gpus }) => gpus.map(({ model }) => model.trim()).filter((model) => model !== ''),
      undefined,
      TOP_GPU_MODELS,
    ),
    accels: share('accel', ({ accels }) =>
      accels.length === 0 ? ['none'] : accels.map((accel) => accel.toLowerCase()),
    ),
    clients: share('client', ({ clients }) =>
      CLIENT_KINDS.filter((kind) => (clients[kind] ?? '0') !== '0'),
    ),
    library: {
      films: shareOfLibrary('films'),
      episodes: shareOfLibrary('episodes'),
      tracks: shareOfLibrary('tracks'),
      books: shareOfLibrary('books'),
    },
  };
};

export { aggregateInstalls };
