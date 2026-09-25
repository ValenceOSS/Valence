import { Icon } from '@ValenceUI/Icon';
import { TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { TabPanel } from '@ValenceUI/TabPanel';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { ActivityPanel } from './components/ActivityPanel/ActivityPanel';
import { ObservabilityPage } from '@ValenceScreens/components/ObservabilityPage/ObservabilityPage';
import { LibrariesPanel } from './components/LibrariesPanel/LibrariesPanel';
import { EncodingPanel } from './components/EncodingPanel/EncodingPanel';
import { FilesPanel } from '@ValenceScreens/components/AdminArea/components/FilesPanel/FilesPanel';
import { MediaPanel } from './components/MediaPanel/MediaPanel';
import { ReencodeDialog } from '@ValenceScreens/components/ReencodeDialog/ReencodeDialog';
import { ReencodeReview } from '@ValenceScreens/components/ReencodeReview/ReencodeReview';
import {
  cancelReencode,
  confirmReencode,
  fetchReencodeEstimate,
  rejectReencode,
  startReencodes,
} from '@ValenceClient/admin/fetchReencodes';
import { MatchPicker } from './components/MatchPicker/MatchPicker';
import { PreviewMomentPicker } from '@ValenceScreens/components/PreviewMomentPicker/PreviewMomentPicker';
import { OverviewPanel } from './components/OverviewPanel/OverviewPanel';
import { RolesPanel } from './components/RolesPanel/RolesPanel';
import { WebhooksPanel } from './components/WebhooksPanel/WebhooksPanel';
import { SharesPanel } from './components/SharesPanel/SharesPanel';
import {
  changeWebhook,
  createWebhook,
  deleteWebhook,
  redeliverWebhook,
  setWebhookEnabled,
  testWebhook,
} from '@ValenceClient/admin/fetchWebhooks';
import { AccountsPanel } from './components/AccountsPanel/AccountsPanel';
import { revealVariants, revealTransition, staggerVariants } from '@ValenceUI/animations/reveal';
import {
  watchMonitor,
  watchActiveSessions,
  stopSession,
  pauseSession,
  messageSession,
  resumeSession,
  addJobTrigger,
  removeJobTrigger,
} from '@ValenceClient/admin/fetchAdmin';
import { rebuildArtefacts } from '@ValenceClient/library/fetchLibrary';
import { deleteMedia } from '@ValenceClient/library/deleteMedia';
import { deleteSeries } from '@ValenceClient/library/deleteSeries';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { AnimatedBytes } from '@ValenceScreens/components/AnimatedBytes/AnimatedBytes';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { StatStrip } from './components/StatStrip/StatStrip';
import { ConcernsBanner } from './components/ConcernsBanner/ConcernsBanner';
import { AdminSetupGuide } from './components/AdminSetupGuide/AdminSetupGuide';
import {
  hasBeenTakenToSetup,
  hideSetupGuide,
  isSetupGuideHidden,
  markTakenToSetup,
} from './setupGuidePreference';
import { collectConcerns } from './collectConcerns';
import { concernKey } from './concernKey';
import { readDismissedConcerns, saveDismissedConcerns } from './dismissedConcerns';
import { standingDismissals } from './standingDismissals';
import { valenceCpuShare } from './valenceCpuShare';
import { valenceMemoryUse } from './valenceMemoryUse';
import { memoryEnvelope } from './memoryEnvelope';
import { libraryDisk } from './libraryDisk';
import { describeGraphics } from './describeGraphics';
import { describeFfmpeg } from './describeFfmpeg';
import { describeCpuShare } from './describeCpuShare';
import { describeValenceMemory } from './describeValenceMemory';
import { describeAcceleration } from './describeAcceleration';
import { describeChains } from './describeChains';
import { describeToneMapping } from './describeToneMapping';
import {
  watchJob,
  subscribe as subscribeToScans,
  getSnapshot as getScanSnapshot,
  startScan,
  startScanAll,
  startResetAll,
  startRegeneratePreviews,
  runDefinedJob,
  runDefinedJobAll,
  clearPartsOfAll,
  stopJobs,
} from './scanCoordinator';
import { notify } from '@ValenceUI/notify';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';
import { followRunningJobs } from './followRunningJobs';
import {
  failureOfAnswer,
  failureOfMissing,
  failureOfRefusal,
  failureOfThrown,
} from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type {
  Reencode,
  ReencodeEstimate,
  ReencodeSettings,
} from '@ValenceContracts/schemas/Reencode';
import type { JobSchedules, ScheduleTrigger } from '@ValenceClient/admin/fetchAdmin';
import type { CreatedWebhook } from '@ValenceClient/admin/fetchWebhooks';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { ADMIN_PANELS } from '@ValenceScreens/components/AdminArea/adminSections';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { RequestsPanel } from './components/RequestsPanel/RequestsPanel';
import { IndexersPanel } from './components/IndexersPanel/IndexersPanel';
import { MediaRequestsPanel } from '@ValenceScreens/components/AdminArea/components/MediaRequestsPanel/MediaRequestsPanel';
import { ProfilesPanel } from '@ValenceScreens/components/AdminArea/components/ProfilesPanel/ProfilesPanel';
import { DownloadsPanel } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/DownloadsPanel';
import { ReleaseSearchPanel } from './components/ReleaseSearchPanel/ReleaseSearchPanel';
import type { AdminAreaProps } from './AdminArea.types';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { sayInParts } from '@ValenceScreens/components/AdminArea/sayInParts';
import { aroundTheFigure } from '@ValenceScreens/components/AdminArea/aroundTheFigure';

const HISTORY_LENGTH = 60;

const PANEL_ORDER = ADMIN_PANELS.map((one) => one.id);

/**
 * The server as the person running it sees it: the dashboard, what is being watched, the libraries
 * and what they hold, the jobs, the settings and the webhooks. Owns the polling that keeps all of it
 * current and the state that outlives any one panel, so that moving between panels neither restarts
 * a scan's tracking nor refetches everything.
 *
 * Which panel is open, and which job's schedule within it, are held above this component rather than
 * inside it, so that both are places the browser's address can name and return to.
 *
 * @param historyLength - How many readings to keep for the graphs.
 * @param panel - Which panel is open, which the dialog around this holds.
 * @param onPanel - Told which panel to open.
 * @param initialJob - The job whose schedule to open, where the address named one.
 * @param observability - What the address says the jobs and logs page is showing and narrowed to.
 * @param onObservabilityChange - Called with each change to it, to write into the address.
 * @param onJobChange - Called with the job whose schedule was opened, or null on going back.
 */
const AdminArea = ({
  historyLength = HISTORY_LENGTH,
  panel,
  onPanel,
  initialJob,
  observability,
  onObservabilityChange,
  onJobChange,
}: AdminAreaProps) => {
  const cache = useQueryClient();
  const [history, setHistory] = useState<number[]>([]);
  const [encoderHistory, setEncoderHistory] = useState<number[]>([]);
  const [viewingJobKind, setViewingJobKind] = useState<string | null>(initialJob ?? null);
  const [correcting, setCorrecting] = useState<MediaSummary | null>(null);
  const [choosingMoment, setChoosingMoment] = useState<MediaSummary | null>(null);
  const chosenDetail = useQuery(libraryQueries.detail(choosingMoment?.id ?? null));
  const {
    progress: scanProgress,
    isScanningAll,
    isResettingAll,
  } = useSyncExternalStore(subscribeToScans, getScanSnapshot);
  const [createdWebhook, setCreatedWebhook] = useState<CreatedWebhook | null>(null);
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);

  const [busyClientId, setBusyClientId] = useState<string | null>(null);
  const [isChoosingReencode, setIsChoosingReencode] = useState(false);
  const [reviewing, setReviewing] = useState<Reencode | null>(null);
  const [reencodeEstimate, setReencodeEstimate] = useState<ReencodeEstimate | null>(null);
  const [isWeighingReencode, setIsWeighingReencode] = useState(false);
  const prefersReducedMotion = useReducedMotionConfig();
  const travel = useTravelDirection(PANEL_ORDER, panel);

  const askedOverview = useQuery(adminQueries.overview());
  const askedLibraries = useQuery(libraryQueries.all());
  const askedProfiles = useQuery(requestsQueries.profiles());
  const askedSessions = useQuery(adminQueries.sessions());
  const askedJobs = useQuery(adminQueries.jobs());
  const askedSchedules = useQuery(adminQueries.schedules());
  const askedMonitor = useQuery(adminQueries.monitor());
  const askedRequests = useQuery(requestsQueries.availability());
  const hasRequests = askedRequests.data?.isEnabled ?? false;
  const askedRequestsOverview = useQuery(requestsQueries.overview(hasRequests));

  const overview = askedOverview.data ?? null;
  const monitor = askedMonitor.data ?? null;
  const [dismissedConcerns, setDismissedConcerns] = useState(readDismissedConcerns);
  const [isSetupHidden, setIsSetupHidden] = useState(isSetupGuideHidden);

  const libraries = useMemo(() => askedLibraries.data ?? [], [askedLibraries.data]);

  const askedMediaKey = adminQueries.everything(libraries.map((library) => library.id)).queryKey;
  const askedMedia = useQuery(adminQueries.everything(libraries.map((library) => library.id)));
  const askedEveryFile = useQuery(adminQueries.everyFile(libraries.map((library) => library.id)));
  const askedReencodes = useQuery(adminQueries.reencodes());

  const askedPermissions = useQuery(sessionQueries.permissions());
  const mayDeleteMedia =
    askedPermissions.data?.isAdministrator === true ||
    (askedPermissions.data?.permissions.includes('media.delete') ?? false);

  const media = askedMedia.data ?? [];
  const everyFile = askedEveryFile.data ?? [];
  const reencodes = askedReencodes.data ?? [];
  const sessions = askedSessions.data ?? [];
  const jobDefinitions = useMemo(() => askedJobs.data ?? [], [askedJobs.data]);

  const jobSchedules = useMemo(
    () =>
      new Map((askedSchedules.data?.schedules ?? []).map((entry) => [entry.kind, entry.triggers])),
    [askedSchedules.data],
  );

  const jobsTimezone = askedSchedules.data?.timezone ?? null;

  const askedWebhooks = useQuery({
    ...adminQueries.webhooks(),
    enabled: panel === 'webhooks',
  });

  const webhooks = askedWebhooks.data ?? [];

  const askedWebhookAccounts = useQuery({
    ...adminQueries.accounts(),
    enabled: panel === 'webhooks',
  });

  const askedWebhookProfiles = useQuery({
    ...profileQueries.everyone(),
    enabled: panel === 'webhooks',
  });

  const webhookAccounts = useMemo(
    () => (askedWebhookAccounts.data ?? []).map((one) => ({ id: one.id, label: one.name })),
    [askedWebhookAccounts.data],
  );

  const webhookProfiles = useMemo(
    () => (askedWebhookProfiles.data ?? []).map((one) => ({ id: one.id, label: one.name })),
    [askedWebhookProfiles.data],
  );

  const askedDeliveries = useQuery(adminQueries.deliveries(openHistoryId));

  const deliveries = openHistoryId === null ? [] : (askedDeliveries.data ?? []);
  const isHistoryLoading = openHistoryId !== null && askedDeliveries.isPending;

  const unreachable = useMemo(() => {
    const readings = {
      overview: askedOverview.isError,
      media: askedMedia.isError,
      monitor: askedMonitor.isError,
      libraries: askedLibraries.isError,
      sessions: askedSessions.isError,
      jobs: askedJobs.isError,
      schedules: askedSchedules.isError,
    };

    return new Set(
      Object.entries(readings)
        .filter(([, failed]) => failed)
        .map(([name]) => name),
    );
  }, [
    askedOverview.isError,
    askedMedia.isError,
    askedMonitor.isError,
    askedLibraries.isError,
    askedSessions.isError,
    askedJobs.isError,
    askedSchedules.isError,
  ]);

  const showPanel = useCallback(
    (next: string) => {
      const found = ADMIN_PANELS.find((candidate) => candidate.id === next);

      if (found === undefined) {
        return;
      }

      onPanel(found.id);
      setViewingJobKind(null);
    },
    [onPanel],
  );

  const loadAll = useCallback(async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: adminQueries.key }),
      cache.invalidateQueries({ queryKey: libraryQueries.key }),
    ]);
  }, [cache]);

  const reloadLibraries = useCallback(
    async () => cache.invalidateQueries({ queryKey: libraryQueries.all().queryKey }),
    [cache],
  );

  const reloadSessions = useCallback(
    async () => cache.invalidateQueries({ queryKey: adminQueries.sessions().queryKey }),
    [cache],
  );

  const reloadReencodes = useCallback(
    async () => cache.invalidateQueries({ queryKey: adminQueries.reencodes().queryKey }),
    [cache],
  );

  const weighReencode = useCallback((mediaIds: string[], settings: ReencodeSettings) => {
    if (mediaIds.length === 0) {
      setReencodeEstimate(null);

      return;
    }

    setIsWeighingReencode(true);

    void fetchReencodeEstimate(mediaIds, settings).then((weighed) => {
      setReencodeEstimate(weighed);
      setIsWeighingReencode(false);
    });
  }, []);

  const onLibraryUpdated = (updated: Library) => {
    cache.setQueryData(libraryQueries.all().queryKey, (current: Library[] = []) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
  };

  const onLibraryDeleted = (libraryId: string) => {
    cache.setQueryData(libraryQueries.all().queryKey, (current: Library[] = []) =>
      current.filter((entry) => entry.id !== libraryId),
    );
    void cache.invalidateQueries({ queryKey: libraryQueries.key });
    void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
  };

  const onLibraryCreated = (library: Library) => {
    cache.setQueryData(libraryQueries.all().queryKey, (current: Library[] = []) => [
      ...current,
      library,
    ]);
  };

  const nameOfLibrary = (libraryId: string): string =>
    libraries.find((library) => library.id === libraryId)?.name ??
    say('admin.adminArea.theLibrary');

  const rescan = async (libraryId: string, force = false) => {
    const name = nameOfLibrary(libraryId);
    const taken = await startScan(libraryId, force);

    tellOutcome(
      force
        ? say('admin.adminArea.readLibraryAgain', { name })
        : say('admin.adminArea.scannedLibrary', { name }),
      failureOfAnswer(taken, say('admin.adminArea.couldNotScan', { name })),
    );
    await reloadLibraries();
  };

  const rescanAll = async () => {
    const taken = await startScanAll(libraries);

    tellOutcome(
      say('admin.adminArea.readEveryLibraryAgain'),
      failureOfAnswer(taken, say('admin.adminArea.couldNotReadEvery')),
    );
    await reloadLibraries();
  };

  const resetAll = async () => {
    const taken = await startResetAll(libraries);

    tellOutcome(
      say('admin.adminArea.rebuiltEvery'),
      failureOfAnswer(taken, say('admin.adminArea.couldNotRebuildEvery')),
    );
    await reloadLibraries();
  };

  const regeneratePreviews = async (libraryId: string) => {
    const name = nameOfLibrary(libraryId);
    const taken = await startRegeneratePreviews(libraryId);

    tellOutcome(
      say('admin.adminArea.generatedPreviews', { name }),
      failureOfAnswer(taken, say('admin.adminArea.couldNotGeneratePreviews', { name })),
    );
  };

  const runJob = useCallback(
    async (kind: string, libraryIds?: string[], parts?: LibraryPart[]) => {
      const definition = jobDefinitions.find((candidate) => candidate.kind === kind);
      const label = definition?.label ?? kind;
      const chosen =
        libraryIds === undefined
          ? libraries
          : libraries.filter((library) => libraryIds.includes(library.id));

      const taken =
        parts !== undefined
          ? await clearPartsOfAll(kind, chosen, parts)
          : definition?.needsLibrary === true
            ? await runDefinedJobAll(kind, chosen)
            : await runDefinedJob(kind);

      tellOutcome(
        say('admin.adminArea.jobFinished', { job: label }),
        failureOfAnswer(taken, say('admin.adminArea.couldNotStartJob', { job: label })),
      );
      await reloadLibraries();
    },
    [jobDefinitions, libraries, reloadLibraries],
  );

  const reloadSchedules = async () =>
    cache.invalidateQueries({ queryKey: adminQueries.schedules().queryKey });

  const addTrigger = async (kind: string, trigger: ScheduleTrigger) => {
    const added = await addJobTrigger(kind, trigger);

    const isAdded = tellOutcome(
      say('admin.adminArea.scheduleAdded'),
      failureOfMissing(added, say('admin.adminArea.couldNotAddSchedule')),
    );

    if (added === null || !isAdded) {
      await reloadSchedules();

      return;
    }

    cache.setQueryData(adminQueries.schedules().queryKey, (current: JobSchedules | undefined) =>
      current === undefined
        ? current
        : {
            ...current,
            schedules: current.schedules.some((entry) => entry.kind === kind)
              ? current.schedules.map((entry) =>
                  entry.kind === kind ? { ...entry, triggers: [...entry.triggers, added] } : entry,
                )
              : [...current.schedules, { kind, triggers: [added] }],
          },
    );
  };

  const removeTrigger = async (kind: string, triggerId: string) => {
    cache.setQueryData(adminQueries.schedules().queryKey, (current: JobSchedules | undefined) =>
      current === undefined
        ? current
        : {
            ...current,
            schedules: current.schedules.map((entry) =>
              entry.kind === kind
                ? { ...entry, triggers: entry.triggers.filter((one) => one.id !== triggerId) }
                : entry,
            ),
          },
    );

    const removed = await removeJobTrigger(kind, triggerId);

    if (
      !tellOutcome(
        say('admin.adminArea.scheduleRemoved'),
        failureOfAnswer(removed, say('admin.adminArea.couldNotRemoveSchedule')),
      )
    ) {
      await reloadSchedules();
    }
  };

  const openJobSchedule = useCallback(
    (kind: string) => {
      setViewingJobKind(kind);
      onJobChange?.(kind);
    },
    [onJobChange],
  );

  const closeJobSchedule = useCallback(() => {
    setViewingJobKind(null);
    onJobChange?.(null);
  }, [onJobChange]);

  const startJob = useCallback(
    (kind: string, libraryIds?: string[], parts?: LibraryPart[]) => {
      void runJob(kind, libraryIds, parts);
    },
    [runJob],
  );

  const stopJob = useCallback(
    (kind: string) => {
      const label = jobDefinitions.find((candidate) => candidate.kind === kind)?.label ?? kind;

      void stopJobs(kind).then((stopped) => {
        tellOutcome(
          say('admin.adminArea.askedJobToStop', { job: label }),
          failureOfAnswer(stopped, say('admin.adminArea.couldNotStopJob', { job: label })),
        );
      });
    },
    [jobDefinitions],
  );

  const stopStream = async (clientId: string) => {
    setBusyClientId(clientId);

    try {
      tellOutcome(
        say('admin.adminArea.streamStopped'),
        failureOfAnswer(await stopSession(clientId), say('admin.adminArea.couldNotStopStream')),
      );
      await reloadSessions();
    } finally {
      setBusyClientId(null);
    }
  };

  const pauseStream = async (clientId: string) => {
    setBusyClientId(clientId);

    try {
      tellOutcome(
        say('admin.adminArea.streamPaused'),
        failureOfAnswer(await pauseSession(clientId), say('admin.adminArea.couldNotPauseStream')),
      );
      await reloadSessions();
    } finally {
      setBusyClientId(null);
    }
  };

  const tellViewer = async (clientId: string, text: string) => {
    setBusyClientId(clientId);

    try {
      tellOutcome(
        say('admin.adminArea.messageSent'),
        failureOfAnswer(
          await messageSession(clientId, text),
          say('admin.adminArea.couldNotSendMessage'),
        ),
      );
    } finally {
      setBusyClientId(null);
    }
  };

  const resumeStream = async (clientId: string) => {
    setBusyClientId(clientId);

    try {
      tellOutcome(
        say('admin.adminArea.streamResumed'),
        failureOfAnswer(await resumeSession(clientId), say('admin.adminArea.couldNotResumeStream')),
      );
      await reloadSessions();
    } finally {
      setBusyClientId(null);
    }
  };

  useEffect(() => followRunningJobs(), []);

  const reloadWebhooks = useCallback(
    async () => cache.invalidateQueries({ queryKey: adminQueries.webhooks().queryKey }),
    [cache],
  );

  const reloadDeliveries = useCallback(
    async (id: string) =>
      cache.invalidateQueries({ queryKey: adminQueries.deliveries(id).queryKey }),
    [cache],
  );

  useEffect(
    () =>
      watchActiveSessions((found) => {
        cache.setQueryData(adminQueries.sessions().queryKey, found);
      }),
    [cache],
  );

  useEffect(() => {
    const stop = watchMonitor((reading) => {
      cache.setQueryData(adminQueries.monitor().queryKey, reading);
      setHistory((current) =>
        [...current, reading.resources.systemCpuPercent].slice(-historyLength),
      );
      setEncoderHistory((current) => {
        const encoder = reading.resources.graphics?.encoderPercent ?? null;

        return encoder === null ? [] : [...current, encoder].slice(-historyLength);
      });
    });

    return stop;
  }, [historyLength, cache]);

  const resources = monitor?.resources ?? null;
  const memory = memoryEnvelope(resources);
  const memoryFraction = memory === null ? 0 : memory.usedBytes / memory.totalBytes;
  const valenceMemory = valenceMemoryUse(resources);

  const cpuShare = valenceCpuShare(resources);
  const mediaDisk = libraryDisk(
    resources?.disks ?? [],
    libraries.map((library) => library.path),
  );

  const acceleration =
    overview === null
      ? null
      : describeAcceleration(overview.settings.hardwareAccel, overview.transcoder.hardwareAccels);
  const chains = overview === null ? null : describeChains(overview.transcoder.chains);
  const toneMapping =
    overview === null
      ? null
      : describeToneMapping(overview.transcoder.toneMapping, overview.transcoder.hardwareToneMaps);

  const ffmpegLine = describeFfmpeg(overview?.transcoder.ffmpegVersion ?? null);

  const graphicsInfo = (
    <dl className="flex flex-col gap-2 text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="shrink-0 text-text-muted">{say('admin.adminArea.hardwareEncoding')}</dt>
        <dd className="min-w-0 truncate text-text">{acceleration?.label ?? '—'}</dd>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <dt className="shrink-0 text-text-muted">{say('admin.adminArea.hardwareChains')}</dt>
        <dd className="min-w-0 truncate text-text">{chains?.label ?? '—'}</dd>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <dt className="shrink-0 text-text-muted">{say('admin.adminArea.hdrConversion')}</dt>
        <dd className="min-w-0 truncate text-text">{toneMapping?.label ?? '—'}</dd>
      </div>

      {toneMapping?.detail === null || toneMapping?.detail === undefined ? null : (
        <dd className="text-text-muted">{toneMapping.detail}</dd>
      )}

      {ffmpegLine === null ? null : (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-text-muted">{say('admin.adminArea.transcoder')}</dt>
          <dd className="min-w-0 text-right text-text">{ffmpegLine}</dd>
        </div>
      )}

      {(resources?.graphicsNotes ?? []).length === 0 ? null : (
        <div className="flex flex-col gap-1 border-t border-[var(--surface-line)] pt-2">
          <dt className="text-text-muted">{say('admin.adminArea.whyNoFigure')}</dt>

          {(resources?.graphicsNotes ?? []).map((note) => (
            <dd key={note} className="text-text">
              {note}
            </dd>
          ))}
        </div>
      )}
    </dl>
  );

  const concerns = collectConcerns({
    overview,
    monitor,
    libraries,
    sessions,
    history,
    encoderHistory,
    requests: hasRequests ? (askedRequestsOverview.data ?? null) : null,
  });
  const isEverythingRead =
    overview !== null &&
    monitor !== null &&
    askedLibraries.data !== undefined &&
    (!hasRequests || askedRequestsOverview.data !== undefined);

  const isSetupDone =
    libraries.length > 0 &&
    overview?.settings.hasCatalogueKey === true &&
    libraries.some((library) => library.lastScannedAt !== null);
  const isGuideOffered = isEverythingRead && !isSetupHidden && !isSetupDone;
  const isGuideOnOverview = panel === 'overview' && isGuideOffered;

  const hideSetup = () => {
    hideSetupGuide();
    setIsSetupHidden(true);
  };

  useEffect(() => {
    if (
      panel === 'overview' &&
      isEverythingRead &&
      libraries.length === 0 &&
      !isSetupHidden &&
      !hasBeenTakenToSetup()
    ) {
      markTakenToSetup();
      onPanel('libraries');
    }
  }, [panel, isEverythingRead, libraries.length, isSetupHidden, onPanel]);

  useEffect(() => {
    if (!isEverythingRead) {
      return;
    }

    const kept = standingDismissals(dismissedConcerns, concerns);

    if (kept.length !== dismissedConcerns.length) {
      setDismissedConcerns(kept);
      saveDismissedConcerns(kept);
    }
  }, [isEverythingRead, concerns, dismissedConcerns]);

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className="flex w-full flex-col gap-5 pb-2"
    >
      <motion.div
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
      >
        {isGuideOnOverview ? (
          <div className="mb-5">
            <AdminSetupGuide
              hasLibrary={libraries.length > 0}
              hasCatalogueKey={overview.settings.hasCatalogueKey}
              hasScanned={libraries.some((library) => library.lastScannedAt !== null)}
              isScanning={isScanningAll}
              onAddLibrary={() => {
                showPanel('libraries');
              }}
              onOpenSettings={() => {
                showPanel('settings');
              }}
              onScanAll={() => {
                void rescanAll();
              }}
              onHide={hideSetup}
            />
          </div>
        ) : null}

        <ConcernsBanner
          concerns={concerns.filter(
            (concern) =>
              !dismissedConcerns.includes(concernKey(concern)) &&
              !(
                (isGuideOnOverview || (panel === 'libraries' && isGuideOffered)) &&
                (concern.id === 'no-libraries' || concern.id === 'no-catalogue-key')
              ),
          )}
          onOpenPanel={showPanel}
          onDismiss={(concern) => {
            const dismissed = [...dismissedConcerns, concernKey(concern)];

            setDismissedConcerns(dismissed);
            saveDismissedConcerns(dismissed);
          }}
        />
      </motion.div>

      <motion.div
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
      >
        <StatStrip
          stats={[
            {
              label: say('admin.adminArea.processor'),
              value: (
                <AnimatedNumber value={Math.round(resources?.systemCpuPercent ?? 0)} suffix="%" />
              ),
              fraction: (resources?.systemCpuPercent ?? 0) / 100,
              detail:
                resources === null
                  ? '—'
                  : sayInParts('admin.adminArea.processorDetail', {
                      cores: (
                        <AnimatedNumber
                          value={resources.cpuCount}
                          {...aroundTheFigure(
                            sayCount('admin.adminArea.cores', resources.cpuCount),
                            resources.cpuCount.toLocaleString('en'),
                          )}
                        />
                      ),
                      share:
                        cpuShare !== null && cpuShare >= 1 ? (
                          <AnimatedNumber value={Math.round(cpuShare)} suffix="%" />
                        ) : (
                          describeCpuShare(cpuShare)
                        ),
                    }),
            },
            {
              label: say('admin.adminArea.memory'),
              value: memory === null ? '—' : <AnimatedBytes bytes={memory.usedBytes} />,
              fraction: memoryFraction,
              detail:
                memory === null
                  ? '—'
                  : sayInParts(
                      memory.isLimited
                        ? 'admin.adminArea.memoryAllowedDetail'
                        : 'admin.adminArea.memoryDetail',
                      {
                        total: <AnimatedBytes bytes={memory.totalBytes} />,
                        used:
                          valenceMemory === null ? (
                            describeValenceMemory(valenceMemory)
                          ) : (
                            <AnimatedBytes bytes={valenceMemory} />
                          ),
                      },
                    ),
            },
            {
              label: say('admin.adminArea.graphics'),
              ...describeGraphics(resources?.graphics ?? null, resources?.graphicsNotes ?? []),
              info: graphicsInfo,
            },
            {
              label: say('admin.adminArea.storage'),
              value:
                mediaDisk === null ? (
                  '—'
                ) : (
                  <AnimatedBytes
                    bytes={mediaDisk.availableBytes}
                    {...aroundTheFigure(say('admin.adminArea.free'), '{bytes}')}
                  />
                ),
              ...(mediaDisk === null
                ? {}
                : {
                    fraction:
                      (mediaDisk.totalBytes - mediaDisk.availableBytes) / mediaDisk.totalBytes,
                  }),
              detail:
                mediaDisk === null
                  ? say('admin.adminArea.notMeasured')
                  : sayInParts('admin.adminArea.storageDetail', {
                      total: <AnimatedBytes bytes={mediaDisk.totalBytes} />,
                      mount: mediaDisk.mountPoint,
                    }),
            },
          ]}
        />
      </motion.div>

      {unreachable.size === 0 ? null : (
        <motion.p
          role="alert"
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-5 py-4 font-body text-sm text-text"
        >
          <Icon of={TriangleAlertIcon} size={18} tone="danger" className="shrink-0" />
          {say('admin.adminArea.partlyUnread')}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void loadAll();
            }}
          >
            {say('common.tryAgain')}
          </Button>
        </motion.p>
      )}

      <motion.div
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        className="flex flex-col gap-5"
      >
        <section>
          <TabPanel value="overview" travel={travel}>
            <OverviewPanel
              overview={overview}
              monitor={monitor}
              libraries={libraries}
              sessions={sessions}
              history={history}
              onOpenPanel={showPanel}
            />
          </TabPanel>

          <TabPanel value="activity" travel={travel}>
            <ActivityPanel
              sessions={sessions}
              busyClientId={busyClientId}
              onStop={(clientId) => {
                void stopStream(clientId);
              }}
              onPause={(clientId) => {
                void pauseStream(clientId);
              }}
              onResume={(clientId) => {
                void resumeStream(clientId);
              }}
              onMessage={tellViewer}
            />
          </TabPanel>

          <TabPanel value="libraries" travel={travel}>
            <LibrariesPanel
              libraries={libraries}
              profiles={askedProfiles.data ?? []}
              progress={scanProgress}
              working={monitor?.queue.jobs ?? []}
              isScanningAll={isScanningAll}
              hasCatalogueKey={overview?.settings.hasCatalogueKey === true}
              isSetupHidden={isSetupHidden}
              onOpenSettings={() => {
                showPanel('settings');
              }}
              onHideSetup={hideSetup}
              isResettingAll={isResettingAll}
              onScan={(libraryId, force) => {
                void rescan(libraryId, force);
              }}
              onScanAll={() => {
                void rescanAll();
              }}
              onResetAll={() => {
                void resetAll();
              }}
              onRegeneratePreviews={(libraryId) => {
                void regeneratePreviews(libraryId);
              }}
              onLibraryCreated={onLibraryCreated}
              onLibraryUpdated={onLibraryUpdated}
              onLibraryDeleted={onLibraryDeleted}
            />
          </TabPanel>

          <TabPanel value="media" travel={travel}>
            <MediaPanel
              isUnreachable={unreachable.has('media')}
              media={media}
              onCorrect={setCorrecting}
              onChooseMoment={(item) => {
                void fetchTrickplay(item.id).then((found) => {
                  if (found === null) {
                    notify.say(say('admin.adminArea.previewsUnfinished', { title: item.title }), {
                      description: say('admin.adminArea.previewsUnfinishedDetail'),
                    });

                    return;
                  }

                  setChoosingMoment(item);
                });
              }}
              onRebuildArtefacts={async (item) =>
                tellOutcome(
                  say('admin.adminArea.rebuildingPreviews', { title: item.title }),
                  failureOfMissing(
                    await rebuildArtefacts(item.id),
                    say('admin.adminArea.couldNotRebuildPreviews', { title: item.title }),
                  ),
                )
              }
              {...(mayDeleteMedia
                ? {
                    onDelete: async (item: MediaSummary) => {
                      const seriesId = item.seriesId ?? null;
                      const name = item.seriesTitle ?? item.title;
                      const isGone = tellOutcome(
                        say('admin.adminArea.deletedMedia', { title: name }),
                        await failureOfThrown(
                          async () => {
                            await (seriesId === null
                              ? deleteMedia(item.id)
                              : deleteSeries(seriesId));
                          },
                          say('admin.adminArea.couldNotDeleteMedia', { title: name }),
                        ),
                      );

                      if (isGone) {
                        cache.setQueryData(askedMediaKey, (current: MediaSummary[] = []) =>
                          current.filter(
                            (entry) =>
                              entry.id !== item.id &&
                              (seriesId === null || entry.seriesId !== seriesId),
                          ),
                        );
                        void cache.invalidateQueries({ queryKey: libraryQueries.key });
                        void cache.invalidateQueries({ queryKey: adminQueries.key });
                      }

                      return isGone;
                    },
                  }
                : {})}
              onReencode={(item) => {
                setIsChoosingReencode(true);
                void weighReencode([item.id], {
                  mode: 'replace',
                  quality: '1080p',
                  videoCodec: 'hevc',
                  audio: 'keep',
                });
              }}
            />
          </TabPanel>

          <TabPanel value="files" travel={travel}>
            <FilesPanel
              libraries={libraries}
              mayDelete={mayDeleteMedia}
              onChanged={() => {
                void cache.invalidateQueries({ queryKey: libraryQueries.key });
                void cache.invalidateQueries({ queryKey: adminQueries.key });
              }}
              onScan={(libraryId) => {
                void rescan(libraryId);
              }}
            />
          </TabPanel>

          <TabPanel value="encoding" travel={travel}>
            <EncodingPanel
              isUnreachable={askedReencodes.isError}
              reencodes={reencodes}
              onReview={setReviewing}
              onStop={async (one) => {
                const stopped = tellOutcome(
                  say('admin.adminArea.reencodeStopped'),
                  failureOfAnswer(
                    await cancelReencode(one.id),
                    say('admin.adminArea.couldNotStopReencode'),
                  ),
                );

                await reloadReencodes();

                return stopped;
              }}
              onChoose={() => {
                setIsChoosingReencode(true);
              }}
            />
          </TabPanel>

          {hasRequests ? (
            <>
              <TabPanel value="requests" travel={travel}>
                <RequestsPanel />
              </TabPanel>

              <TabPanel value="indexers" travel={travel}>
                <IndexersPanel />
              </TabPanel>

              <TabPanel value="search" travel={travel}>
                <ReleaseSearchPanel />
              </TabPanel>

              <TabPanel value="requested" travel={travel}>
                <MediaRequestsPanel />
              </TabPanel>

              <TabPanel value="profiles" travel={travel}>
                <ProfilesPanel />
              </TabPanel>

              <TabPanel value="downloads" travel={travel}>
                <DownloadsPanel />
              </TabPanel>
            </>
          ) : null}

          <TabPanel value="accounts" travel={travel}>
            <AccountsPanel />
          </TabPanel>

          <TabPanel value="roles" travel={travel}>
            <RolesPanel />
          </TabPanel>

          <TabPanel value="settings" travel={travel}>
            <SettingsPanel
              overview={overview}
              onCatalogueKeySaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onHardwareAccelSaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onRoundnessSaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
                void cache.invalidateQueries({ queryKey: appearanceQueries.key });
              }}
              onPreviewQualitySaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onCertificationRegionSaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onProfileVisibilitySaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onCatalogueTrailersSaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onMusicDetailsSaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
              }}
              onSplashscreenSaved={() => {
                void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
                void cache.invalidateQueries({ queryKey: sessionQueries.wayIn().queryKey });
              }}
            />
          </TabPanel>

          <TabPanel value="shares" travel={travel}>
            <SharesPanel />
          </TabPanel>

          <TabPanel value="webhooks" travel={travel}>
            <WebhooksPanel
              webhooks={webhooks}
              accounts={webhookAccounts}
              profiles={webhookProfiles}
              hasRequests={hasRequests}
              created={createdWebhook}
              onCreate={async (webhook) => {
                const { created, refusal } = await createWebhook(webhook);

                if (tellOutcome(say('admin.adminArea.webhookCreated'), failureOfRefusal(refusal))) {
                  setCreatedWebhook(created);
                  await reloadWebhooks();
                }

                return refusal;
              }}
              onEdit={async (id, change) => {
                const refusal = await changeWebhook(id, change);

                if (tellOutcome(say('admin.adminArea.webhookSaved'), failureOfRefusal(refusal))) {
                  await reloadWebhooks();
                }

                return refusal;
              }}
              onDismissCreated={() => {
                setCreatedWebhook(null);
              }}
              onSetEnabled={(id, enabled) => {
                void setWebhookEnabled(id, enabled).then((refusal) => {
                  tellOutcome(
                    enabled ? say('admin.adminArea.webhookOn') : say('admin.adminArea.webhookOff'),
                    failureOfRefusal(refusal),
                  );

                  return reloadWebhooks();
                });
              }}
              onDelete={(id) => {
                void deleteWebhook(id).then((refusal) => {
                  tellOutcome(say('admin.adminArea.webhookDeleted'), failureOfRefusal(refusal));

                  return reloadWebhooks();
                });
              }}
              onTest={(id) => {
                void testWebhook(id).then((refusal) => {
                  tellOutcome(say('admin.adminArea.testSent'), failureOfRefusal(refusal));
                });
              }}
              deliveries={deliveries}
              openHistoryId={openHistoryId}
              isHistoryLoading={isHistoryLoading}
              onOpenHistory={setOpenHistoryId}
              onRedeliver={(subscriptionId, deliveryId) => {
                void redeliverWebhook(subscriptionId, deliveryId).then((refusal) => {
                  tellOutcome(say('admin.adminArea.redelivered'), failureOfRefusal(refusal));

                  return reloadDeliveries(subscriptionId);
                });
              }}
            />
          </TabPanel>

          <TabPanel value="jobs" travel={travel}>
            <ObservabilityPage
              {...(observability === undefined ? {} : { search: observability })}
              {...(onObservabilityChange === undefined
                ? {}
                : { onSearchChange: onObservabilityChange })}
              definitions={jobDefinitions}
              libraries={libraries}
              progress={scanProgress}
              monitor={monitor}
              viewingJobKind={viewingJobKind}
              schedules={jobSchedules}
              schedulesTimezone={jobsTimezone}
              onRun={startJob}
              onStop={stopJob}
              onOpenSchedule={openJobSchedule}
              onCloseSchedule={closeJobSchedule}
              onAddTrigger={(kind, trigger) => {
                void addTrigger(kind, trigger);
              }}
              onRemoveTrigger={(kind, triggerId) => {
                void removeTrigger(kind, triggerId);
              }}
            />
          </TabPanel>
        </section>
      </motion.div>

      <MatchPicker
        media={correcting}
        onClose={() => {
          setCorrecting(null);
        }}
        onCorrected={(jobId) => {
          const libraryId = correcting?.libraryId ?? null;

          void (
            jobId === null || libraryId === null
              ? Promise.resolve()
              : watchJob(libraryId, 'library.readAgain', jobId)
          ).then(async () => {
            await cache.invalidateQueries({
              queryKey: adminQueries.everything(libraries.map((library) => library.id)).queryKey,
            });
          });
        }}
      />

      <PreviewMomentPicker
        mediaId={choosingMoment?.id ?? ''}
        title={choosingMoment?.title ?? ''}
        durationSeconds={choosingMoment?.durationSeconds ?? 0}
        current={chosenDetail.data?.previewMoment ?? null}
        isOpen={choosingMoment !== null}
        onClose={() => {
          setChoosingMoment(null);
        }}
        onChanged={() => {
          if (choosingMoment !== null) {
            void cache.invalidateQueries({
              queryKey: libraryQueries.detail(choosingMoment.id).queryKey,
            });
          }
        }}
      />

      <ReencodeDialog
        isOpen={isChoosingReencode}
        libraries={libraries}
        media={everyFile}
        estimate={reencodeEstimate}
        isWeighing={isWeighingReencode}
        onWeigh={weighReencode}
        onStart={async (mediaIds, settings) => {
          const started = await startReencodes(mediaIds, settings);
          const isStarted = started !== null && started.started.length > 0;

          tellOutcome(
            say('admin.adminArea.reencodingStarted'),
            failureOfAnswer(isStarted, say('admin.adminArea.couldNotReencode')),
          );
          await reloadReencodes();

          return isStarted;
        }}
        onClose={() => {
          setIsChoosingReencode(false);
          setReencodeEstimate(null);
        }}
      />

      <ReencodeReview
        reencode={reviewing}
        onConfirm={async (id) => {
          const done = tellOutcome(
            say('admin.adminArea.keptNewEncode'),
            failureOfAnswer(await confirmReencode(id), say('admin.adminArea.couldNotConfirm')),
          );

          await Promise.all([reloadReencodes(), loadAll()]);

          return done;
        }}
        onReject={async (id) => {
          const done = tellOutcome(
            say('admin.adminArea.originalBack'),
            failureOfAnswer(await rejectReencode(id), say('admin.adminArea.couldNotPutBack')),
          );

          await Promise.all([reloadReencodes(), loadAll()]);

          return done;
        }}
        onClose={() => {
          setReviewing(null);
        }}
      />
    </motion.div>
  );
};

AdminArea.displayName = 'AdminArea';

export { AdminArea };
