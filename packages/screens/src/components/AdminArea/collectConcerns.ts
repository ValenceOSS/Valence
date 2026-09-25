import { docsFor } from '@ValenceCore/functions/docsFor';
import type { ActiveSession, AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import { valenceCpuShare } from './valenceCpuShare';
import { libraryDisk } from './libraryDisk';
import { memoryEnvelope } from './memoryEnvelope';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

type ConcernTone = 'broken' | 'attention' | 'setup';

type Concern = {
  id: string;
  tone: ConcernTone;
  title: string;
  detail: string;
  panel: string;
  help?: string | null;
};

type CollectConcernsOptions = {
  overview: AdminOverview | null;
  monitor: Monitor | null;
  libraries: Library[];
  sessions?: ActiveSession[];
  history?: number[];
  encoderHistory?: number[];
  requests?: RequestsOverview | null;
};

const MEMORY_PRESSURE = 0.92;

const CPU_PRESSURE = 90;

const CPU_READINGS = 15;

const ENCODER_PRESSURE = 90;

const DISK_PRESSURE = 0.95;

const VALENCE_BLAME = 50;

const STARVED_SECONDS = 2;

const TONE_ORDER: Record<ConcernTone, number> = { broken: 0, attention: 1, setup: 2 };

/**
 * Gathers everything wrong with this server into one ordered list, worst first: a service that cannot
 * be reached, jobs that failed, resources under pressure, streams about to stall, and libraries
 * nobody has scanned yet. Each carries the panel it can be dealt with in, so the banner can send an
 * administrator straight there rather than describing where to look.
 *
 * @param overview - What the server reports about itself, or null before it has answered.
 * @param monitor - The live readings, or null before any have arrived.
 * @param libraries - The libraries configured.
 * @param sessions - What is being watched at the moment.
 * @param history - Recent processor readings, used to tell a spike from sustained load.
 * @param encoderHistory - The same for the graphics encoder.
 * @param requests - What the server last heard from the requests service, where requesting is on.
 * @returns The concerns, broken things before things merely wanting attention.
 */
const collectConcerns = ({
  overview,
  monitor,
  libraries,
  sessions = [],
  history = [],
  encoderHistory = [],
  requests = null,
}: CollectConcernsOptions): Concern[] => {
  const concerns: Concern[] = [];

  if (requests !== null && requests.checkedAt !== null && !requests.isReachable) {
    concerns.push({
      id: 'requests',
      tone: 'broken',
      title: say('admin.collectConcerns.requestsTitle'),
      detail:
        requests.problem === null
          ? say('admin.collectConcerns.requestsLookedAt', { address: requests.address })
          : say('admin.collectConcerns.requestsProblem', { problem: requests.problem }),
      panel: 'requests',
      help: docsFor(requests.problemCode ?? 'RequestsUnreachable'),
    });
  }

  const failingIndexers =
    requests?.isReachable === true ? (requests.status?.indexers.failing ?? []) : [];

  if (failingIndexers.length > 0) {
    const [first] = failingIndexers;

    concerns.push({
      id: 'requests-indexers',
      tone: 'attention',
      title:
        failingIndexers.length === 1
          ? say('admin.collectConcerns.indexerFailing', { name: first?.name ?? '' })
          : sayCount('admin.collectConcerns.indexersFailing', failingIndexers.length),
      detail:
        failingIndexers.length === 1
          ? (first?.problem ?? '')
          : failingIndexers.map((indexer) => `${indexer.name}: ${indexer.problem}`).join(' · '),
      panel: 'indexers',
      help: docsFor(failingIndexers.length === 1 ? first?.problemCode : null),
    });
  }

  const vpn = requests?.status?.vpn ?? null;

  if (requests?.isReachable === true && vpn?.isConfigured === true && vpn.isUp === false) {
    concerns.push({
      id: 'requests-vpn',
      tone: 'broken',
      title: say('admin.collectConcerns.vpnTitle'),
      detail: vpn.problem ?? say('admin.collectConcerns.vpnDetail'),
      panel: 'requests',
      help: docsFor(vpn.problemCode ?? 'VpnDown'),
    });
  }

  if (overview !== null && !overview.transcoder.isReachable) {
    const address = overview.transcoder.address;

    concerns.push({
      id: 'transcoder',
      tone: 'broken',
      title: say('admin.collectConcerns.transcoderTitle'),
      detail:
        address === ''
          ? say('admin.collectConcerns.transcoderDetail')
          : say('admin.collectConcerns.transcoderLookedAt', { address }),
      panel: 'activity',
    });
  }

  if (
    overview !== null &&
    overview.transcoder.isReachable &&
    !overview.transcoder.ffmpegSupported
  ) {
    const version = overview.transcoder.ffmpegVersion;

    concerns.push({
      id: 'ffmpeg-version',
      tone: 'attention',
      title: say('admin.collectConcerns.ffmpegTitle'),
      detail:
        version === null
          ? say('admin.collectConcerns.ffmpegDetail')
          : say('admin.collectConcerns.ffmpegVersionDetail', { version }),
      panel: 'activity',
    });
  }

  const failed = (monitor?.queue.jobs ?? []).filter((job) => job.state === 'failed');

  if (failed.length > 0) {
    concerns.push({
      id: 'failed-jobs',
      tone: 'broken',
      title: sayCount('admin.collectConcerns.jobsFailed', failed.length),
      detail: failed[0]?.failure?.message ?? say('admin.collectConcerns.jobsFailedDetail'),
      panel: 'jobs',
    });
  }

  const stalled = overview?.jobs.stalled ?? [];
  const worst = stalled[0];

  if (worst !== undefined) {
    concerns.push({
      id: 'stalled-jobs',
      tone: 'broken',
      title:
        stalled.length === 1
          ? worst.everSucceeded
            ? say('admin.collectConcerns.stalledOne', { job: worst.label })
            : say('admin.collectConcerns.neverSucceeded', { job: worst.label })
          : sayCount('admin.collectConcerns.stalledKinds', stalled.length),
      detail: say('admin.collectConcerns.stalledDetail', { reason: worst.reason }),
      panel: 'jobs',
    });
  }

  const resources = monitor?.resources ?? null;

  const memory = memoryEnvelope(resources);

  if (memory !== null && memory.usedBytes / memory.totalBytes > MEMORY_PRESSURE) {
    concerns.push({
      id: 'memory',
      tone: 'attention',
      title: memory.isLimited
        ? say('admin.collectConcerns.memoryLimited')
        : say('admin.collectConcerns.memoryFull'),
      detail: say('admin.collectConcerns.memoryDetail'),
      panel: 'activity',
    });
  }

  const disk = libraryDisk(
    resources?.disks ?? [],
    libraries.map((library) => library.path),
  );

  if (
    disk !== null &&
    disk.totalBytes > 0 &&
    (disk.totalBytes - disk.availableBytes) / disk.totalBytes > DISK_PRESSURE
  ) {
    concerns.push({
      id: 'disk',
      tone: 'attention',
      title: say('admin.collectConcerns.diskTitle'),
      detail: say('admin.collectConcerns.diskDetail', {
        left: formatBytes(disk.availableBytes),
        mount: disk.mountPoint,
      }),
      panel: 'libraries',
    });
  }

  const recent = history.slice(-CPU_READINGS);

  if (recent.length === CPU_READINGS && recent.every((reading) => reading > CPU_PRESSURE)) {
    const share = valenceCpuShare(resources);

    concerns.push({
      id: 'cpu',
      tone: 'attention',
      title: say('admin.collectConcerns.cpuTitle'),
      detail:
        share === null
          ? say('admin.collectConcerns.cpuDetail')
          : share >= VALENCE_BLAME
            ? say('admin.collectConcerns.cpuValence', { share: share.toFixed(0) })
            : say('admin.collectConcerns.cpuElsewhere', { share: share.toFixed(0) }),
      panel: 'activity',
    });
  }

  const artefacts = monitor?.resources.artefacts ?? null;

  if (artefacts !== null && !artefacts.survivesRestart) {
    concerns.push({
      id: 'artefacts',
      tone: 'attention',
      title: say('admin.collectConcerns.artefactsTitle'),
      detail: say('admin.collectConcerns.artefactsDetail', { folder: artefacts.root }),
      panel: 'activity',
    });
  }

  const encoderRecent = encoderHistory.slice(-CPU_READINGS);

  if (
    encoderRecent.length === CPU_READINGS &&
    encoderRecent.every((reading) => reading > ENCODER_PRESSURE)
  ) {
    concerns.push({
      id: 'encoder',
      tone: 'attention',
      title: say('admin.collectConcerns.encoderTitle'),
      detail: say('admin.collectConcerns.encoderDetail'),
      panel: 'activity',
    });
  }

  const starved = sessions.filter(
    (session) =>
      session.playback !== null &&
      session.playback.isPlaying &&
      session.playback.health !== null &&
      session.playback.health.bufferedAheadSeconds < STARVED_SECONDS,
  );

  if (starved.length > 0) {
    const starvedName = starved[0]?.profileName ?? null;

    concerns.push({
      id: 'starved-sessions',
      tone: 'attention',
      title:
        starved.length === 1
          ? starvedName === null
            ? say('admin.collectConcerns.somebodyStarved')
            : say('admin.collectConcerns.starvedOne', { name: starvedName })
          : sayCount('admin.collectConcerns.streamsStarved', starved.length),
      detail: say('admin.collectConcerns.starvedDetail'),
      panel: 'activity',
    });
  }

  const unscanned = libraries.filter((library) => library.lastScannedAt === null);

  if (unscanned.length > 0) {
    concerns.push({
      id: 'unscanned',
      tone: 'attention',
      title:
        unscanned.length === 1
          ? unscanned[0] === undefined
            ? say('admin.collectConcerns.aLibraryUnscanned')
            : say('admin.collectConcerns.unscannedOne', { name: unscanned[0].name })
          : sayCount('admin.collectConcerns.librariesUnscanned', unscanned.length),
      detail: say('admin.collectConcerns.unscannedDetail'),
      panel: 'libraries',
    });
  }

  if (overview !== null && libraries.length === 0) {
    concerns.push({
      id: 'no-libraries',
      tone: 'setup',
      title: say('admin.collectConcerns.noLibrariesTitle'),
      detail: say('admin.collectConcerns.noLibrariesDetail'),
      panel: 'libraries',
    });
  }

  if (overview !== null && !overview.settings.hasCatalogueKey) {
    concerns.push({
      id: 'no-catalogue-key',
      tone: 'setup',
      title: say('admin.collectConcerns.noKeyTitle'),
      detail: say('admin.collectConcerns.noKeyDetail'),
      panel: 'settings',
    });
  }

  return [...concerns].sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
};

export { collectConcerns };
export type { Concern, ConcernTone };
