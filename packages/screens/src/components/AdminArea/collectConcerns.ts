import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import type { ActiveSession, AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import type { JobRunPage } from '@ValenceContracts/schemas/JobRun';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
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
  search?: ObservabilitySearch;
  help?: string | null;
  items?: { name: string; problem: string }[];
};

type CollectConcernsOptions = {
  overview: AdminOverview | null;
  monitor: Monitor | null;
  libraries: Library[];
  sessions?: ActiveSession[];
  history?: number[];
  encoderHistory?: number[];
  requests?: RequestsOverview | null;
  recentFailures?: JobRunPage | null;
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
 * @param recentFailures - The job runs that failed in the last day, counted, with the latest of them.
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
  recentFailures = null,
}: CollectConcernsOptions): Concern[] => {
  const concerns: Concern[] = [];

  if (requests !== null && requests.checkedAt !== null && !requests.isReachable) {
    const problem = sayAgainIfAny(requests.problem);

    concerns.push({
      id: 'requests',
      tone: 'broken',
      title: say('screens.adminArea.collectConcerns.theRequestsServiceIsUnreachable'),
      detail:
        problem === null
          ? say('screens.adminArea.collectConcerns.nothingRequestedUntilBackLookedAt', {
              address: requests.address,
            })
          : say('screens.adminArea.collectConcerns.nothingRequestedUntilBackProblem', { problem }),
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
          ? say('screens.adminArea.collectConcerns.theIndexerNameKeepsFailing', {
              name: first?.name ?? '',
            })
          : sayCount(
              'screens.adminArea.collectConcerns.indexersKeepFailing',
              failingIndexers.length,
            ),
      detail:
        failingIndexers.length === 1
          ? (sayAgainIfAny(first?.problem) ?? '')
          : failingIndexers.map((indexer) => indexer.name).join(', '),
      panel: 'indexers',
      ...(failingIndexers.length === 1
        ? {}
        : {
            items: failingIndexers.map((indexer) => ({
              name: indexer.name,
              problem: sayAgain(indexer.problem),
            })),
          }),
      help: docsFor(failingIndexers.length === 1 ? first?.problemCode : null),
    });
  }

  const vpn = requests?.status?.vpn ?? null;

  if (requests?.isReachable === true && vpn?.isConfigured === true && vpn.isUp === false) {
    concerns.push({
      id: 'requests-vpn',
      tone: 'broken',
      title: say('screens.adminArea.collectConcerns.theVPNIsDown'),
      detail:
        sayAgainIfAny(vpn.problem) ??
        say('screens.adminArea.collectConcerns.theRequestsServiceCannotReachThe'),
      panel: 'requests',
      help: docsFor(vpn.problemCode ?? 'VpnDown'),
    });
  }

  const solver = requests?.status?.solver ?? null;

  if (requests?.isReachable === true && solver !== null && solver.startProblem !== null) {
    concerns.push({
      id: 'requests-solver',
      tone: 'broken',
      title: say('screens.adminArea.collectConcerns.theCloudflareSolverWillNotStart'),
      detail: sayAgain(solver.startProblem),
      panel: 'requests',
      help: docsFor('CloudflareCheckFailed'),
    });
  }

  if (overview !== null && !overview.transcoder.isReachable) {
    const address = overview.transcoder.address;

    concerns.push({
      id: 'transcoder',
      tone: 'broken',
      title: say('screens.adminArea.collectConcerns.theMediaServiceIsUnreachable'),
      detail:
        address === ''
          ? say('screens.adminArea.collectConcerns.nothingThatNeedsConvertingWillPlay2')
          : say('screens.adminArea.collectConcerns.nothingThatNeedsConvertingWillPlay', {
              address,
            }),
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
      title: say('screens.adminArea.collectConcerns.theMediaServiceIsRunningAn'),
      detail:
        version === null
          ? say('screens.adminArea.collectConcerns.everythingStillPlaysButTheFilters')
          : say('screens.adminArea.collectConcerns.everythingStillPlaysOnVersionBut', { version }),
      panel: 'activity',
    });
  }

  const failed = recentFailures?.total ?? 0;

  if (failed > 0) {
    concerns.push({
      id: 'failed-jobs',
      tone: 'broken',
      title:
        failed === 1
          ? say('screens.adminArea.collectConcerns.aJobFailedInTheLast')
          : say('screens.adminArea.collectConcerns.failedJobsFailedInTheLast', {
              failed: failed.toString(),
            }),
      detail:
        sayAgainIfAny(recentFailures?.records[0]?.errorMessage) ??
        say('screens.adminArea.collectConcerns.openTheListToSeeWhat'),
      panel: 'jobs',
      search: { view: 'jobs', rstatus: 'failed', range: '24h' },
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
            ? say('screens.adminArea.collectConcerns.labelFailsEveryTimeItRuns', {
                label: sayAgain(worst.label),
              })
            : say('screens.adminArea.collectConcerns.labelHasNeverOnceSucceeded', {
                label: sayAgain(worst.label),
              })
          : sayCount('screens.adminArea.collectConcerns.kindsOfJobFailEveryTime', stalled.length),
      detail: say('screens.adminArea.collectConcerns.nothingOnItsScheduleHasHappened', {
        reason: sayAgain(worst.reason),
      }),
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
        ? say('screens.adminArea.collectConcerns.valenceIsNearlyAtTheMemory')
        : say('screens.adminArea.collectConcerns.memoryIsNearlyFull'),
      detail: say('screens.adminArea.collectConcerns.convertingSeveralThingsAtOnceMay'),
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
      title: say('screens.adminArea.collectConcerns.theLibraryDiskIsNearlyFull'),
      detail: say('screens.adminArea.collectConcerns.availableBytesLeftOnMountPointAScan', {
        availableBytes: formatBytes(disk.availableBytes),
        mountPoint: disk.mountPoint,
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
      title: say('screens.adminArea.collectConcerns.theProcessorHasBeenAtFull'),
      detail:
        share === null
          ? say('screens.adminArea.collectConcerns.playbackThatNeedsConvertingMayStutter')
          : share >= VALENCE_BLAME
            ? say('screens.adminArea.collectConcerns.valenceIsUsingShareOfThe2', {
                share: share.toFixed(0),
              })
            : say('screens.adminArea.collectConcerns.valenceIsUsingShareOfThe', {
                share: share.toFixed(0),
              }),
      panel: 'activity',
    });
  }

  const artefacts = monitor?.resources.artefacts ?? null;

  if (artefacts !== null && !artefacts.survivesRestart) {
    concerns.push({
      id: 'artefacts',
      tone: 'attention',
      title: say('screens.adminArea.collectConcerns.previewsAndThumbnailsAreNotBeing'),
      detail: say('screens.adminArea.collectConcerns.theyAreBeingWrittenToRoot', {
        root: artefacts.root,
      }),
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
      title: say('screens.adminArea.collectConcerns.theGraphicsEncoderHasBeenAt'),
      detail: say('screens.adminArea.collectConcerns.theNextStreamThatNeedsConverting'),
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
    const watching = starved[0]?.profileName ?? null;

    concerns.push({
      id: 'starved-sessions',
      tone: 'attention',
      title:
        starved.length === 1
          ? watching === null
            ? say('screens.adminArea.collectConcerns.somebodyIsRunningOutOfBuffer')
            : say('screens.adminArea.collectConcerns.nameIsRunningOutOfBuffer', { name: watching })
          : sayCount('screens.adminArea.collectConcerns.streamsRunningOutOfBuffer', starved.length),
      detail: say('screens.adminArea.collectConcerns.theyAreSecondsFromStallingThe'),
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
            ? say('screens.adminArea.collectConcerns.aLibraryHasNeverBeenScanned')
            : say('screens.adminArea.collectConcerns.nameHasNeverBeenScanned', {
                name: unscanned[0].name,
              })
          : sayCount('screens.adminArea.collectConcerns.librariesNeverScanned', unscanned.length),
      detail: say('screens.adminArea.collectConcerns.nothingInThemCanBeWatched'),
      panel: 'libraries',
    });
  }

  if (overview !== null && libraries.length === 0) {
    concerns.push({
      id: 'no-libraries',
      tone: 'setup',
      title: say('screens.adminArea.collectConcerns.thereAreNoLibrariesYet'),
      detail: say('screens.adminArea.collectConcerns.addOnePointingAtAFolder'),
      panel: 'libraries',
    });
  }

  if (overview !== null && !overview.settings.hasCatalogueKey) {
    concerns.push({
      id: 'no-catalogue-key',
      tone: 'setup',
      title: say('screens.adminArea.collectConcerns.noMetadataCatalogueKeyIsSet'),
      detail: say('screens.adminArea.collectConcerns.titlesArtworkAndYearsComeFrom'),
      panel: 'settings',
    });
  }

  return [...concerns].sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
};

export { collectConcerns };
export type { Concern, ConcernTone };
