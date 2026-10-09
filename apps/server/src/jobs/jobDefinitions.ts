import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { z } from 'zod';
import { LibraryPartSchema } from '@ValenceContracts/schemas/LibraryPart';
import type { JobGroup } from '@ValenceContracts/schemas/JobGroup';
import {
  SCAN_LIBRARY_JOB,
  REGENERATE_PREVIEWS_JOB,
  REGENERATE_TRICKPLAY_JOB,
  FETCH_LOGOS_JOB,
  PRUNE_HISTORY_JOB,
  DETECT_SEGMENTS_JOB,
  CLEAR_LIBRARY_PARTS_JOB,
  CLEANUP_IMAGE_CACHE_JOB,
  CLEANUP_ARTEFACT_CACHE_JOB,
  CLEANUP_SESSIONS_JOB,
  CLEAR_OLD_DOWNLOADS_JOB,
  CHECK_CATALOGUE_CONNECTIVITY_JOB,
  CHECK_TRANSCODER_JOB,
  CHECK_DISK_SPACE_JOB,
  SYNC_LINKED_CATALOGUES_JOB,
  CHECK_REQUESTS_JOB,
  REFRESH_REQUESTS_JOB,
  SEND_MEDIA_DIGEST_JOB,
  PRUNE_WEBHOOK_DELIVERIES_JOB,
  PRUNE_LOGS_JOB,
  PRUNE_JOB_HISTORY_JOB,
  PRUNE_RESOURCE_HISTORY_JOB,
  REENCODE_JOB,
  PRE_TRANSCODE_JOB,
  FETCH_SUBTITLES_JOB,
  IMPORT_PLAN_JOB,
  IMPORT_RUN_JOB,
  scheduleTriggerKind,
} from './JobQueue';
import type { ScheduleTrigger } from './scheduleTrigger';

const RESET_LIBRARY_JOB = 'library.reset';

type JobDefinition = {
  kind: string;
  label: Said;
  group: JobGroup;
  description: Said;
  needsLibrary: boolean;
  destructive: boolean;
  takesParts: boolean;
  announcesFinish: boolean;
  runsByHand: boolean;
  schedulable: boolean;
};

const JOB_DEFINITIONS: JobDefinition[] = [
  {
    kind: SCAN_LIBRARY_JOB,
    label: saying('common.scanForChanges'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.findsNewChangedAndRemovedFiles'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REGENERATE_PREVIEWS_JOB,
    label: saying('common.generateMissingPreviews'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.rendersPreviewClipsForItemsWithout'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REGENERATE_TRICKPLAY_JOB,
    label: saying('server.jobs.jobDefinitions.generateMissingScrubPreviews'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.rendersSeekBarThumbnailsForItems'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: FETCH_LOGOS_JOB,
    label: saying('server.jobs.jobDefinitions.fetchMissingLogos'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.fetchesTitleLogosFromTMDB'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: DETECT_SEGMENTS_JOB,
    label: saying('server.jobs.jobDefinitions.detectMissingIntrosAndOutros'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.findsIntrosAndRecapsSoViewers'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: RESET_LIBRARY_JOB,
    label: saying('common.resetAndRebuild'),
    group: 'reset',
    description: saying('server.jobs.jobDefinitions.deletesEveryLibraryItemAndRebuilds'),
    needsLibrary: true,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: false,
  },
  {
    kind: CLEAR_LIBRARY_PARTS_JOB,
    label: saying('common.clearAndFetchAgain'),
    group: 'reset',
    description: saying('server.jobs.jobDefinitions.erasesChosenPartsOfALibrary'),
    needsLibrary: true,
    destructive: true,
    takesParts: true,
    announcesFinish: true,
    runsByHand: true,
    schedulable: false,
  },
  {
    kind: CLEANUP_IMAGE_CACHE_JOB,
    label: saying('server.jobs.jobDefinitions.cleanUpCachedImages'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.deletesCachedArtworkAndBookPages'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CLEANUP_ARTEFACT_CACHE_JOB,
    label: saying('server.jobs.jobDefinitions.cleanUpCachedPreviews'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.deletesPreviewClipsAndThumbnailsNothing'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_HISTORY_JOB,
    label: saying('server.jobs.jobDefinitions.pruneOldViewingHistory'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.forgetsViewingsOlderThanAYear'),
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CLEANUP_SESSIONS_JOB,
    label: saying('server.jobs.jobDefinitions.cleanUpSessions'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.clearsExpiredSignIns'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CLEAR_OLD_DOWNLOADS_JOB,
    label: saying('server.jobs.jobDefinitions.clearOutOldDownloads'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.deletesOfflineDownloadsNobodyHasFetched'),
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_CATALOGUE_CONNECTIVITY_JOB,
    label: saying('server.jobs.jobDefinitions.checkCatalogueConnectivity'),
    group: 'health',
    description: saying('server.jobs.jobDefinitions.checksTheTMDBKeyStillWorks'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_TRANSCODER_JOB,
    label: saying('server.jobs.jobDefinitions.checkTheTranscoder'),
    group: 'health',
    description: saying('server.jobs.jobDefinitions.checksTheTranscoderIsStillAnswering'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: SYNC_LINKED_CATALOGUES_JOB,
    label: saying('server.jobs.jobDefinitions.readWhatLinkedServersShare'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.keepsTheTitlesOtherValenceServers'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_DISK_SPACE_JOB,
    label: saying('server.jobs.jobDefinitions.checkDiskSpace'),
    group: 'health',
    description: saying('server.jobs.jobDefinitions.warnsBeforeADiskFillsUp'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_REQUESTS_JOB,
    label: saying('server.jobs.jobDefinitions.checkTheRequestsService'),
    group: 'health',
    description: saying('server.jobs.jobDefinitions.checksTheRequestsServiceAndIts'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REFRESH_REQUESTS_JOB,
    label: saying('server.jobs.jobDefinitions.bringRequestsUpToDateWith'),
    group: 'requests',
    description: saying('server.jobs.jobDefinitions.checksTMDBForNewEpisodesAnd'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: SEND_MEDIA_DIGEST_JOB,
    label: saying('server.jobs.jobDefinitions.tellTheHouseholdAboutNewMedia'),
    group: 'notifications',
    description: saying('server.jobs.jobDefinitions.sendsOneNotificationForEverythingNewly'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_LOGS_JOB,
    label: saying('server.jobs.jobDefinitions.pruneOldLogRecords'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.deletesLogRecordsPastTheirRetention'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_WEBHOOK_DELIVERIES_JOB,
    label: saying('server.jobs.jobDefinitions.pruneOldWebhookDeliveries'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.forgetsWebhookDeliveriesOlderThanA'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_JOB_HISTORY_JOB,
    label: saying('server.jobs.jobDefinitions.pruneOldJobHistory'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.forgetsJobRunsOlderThan30'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REENCODE_JOB,
    label: saying('server.jobs.jobDefinitions.workThroughTheReEncodingQueue'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.makesTheReEncodesAnAdministrator'),
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
    runsByHand: false,
    schedulable: false,
  },
  {
    kind: FETCH_SUBTITLES_JOB,
    label: saying('server.jobs.jobDefinitions.fetchSubtitles'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.findsSubtitlesInTheHouseholdsLanguages'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRE_TRANSCODE_JOB,
    label: saying('server.jobs.jobDefinitions.preTranscodeTheLibraries'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.keepsACopyBesideEachFilm'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_RESOURCE_HISTORY_JOB,
    label: saying('server.jobs.jobDefinitions.pruneOldServerLoadHistory'),
    group: 'housekeeping',
    description: saying('server.jobs.jobDefinitions.forgetsServerLoadSamplesOlderThan'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: IMPORT_PLAN_JOB,
    label: saying('server.jobs.jobDefinitions.planAnImport'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.readsJellyfinEmbyOrPlexWithoutWriting'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: false,
    schedulable: false,
  },
  {
    kind: IMPORT_RUN_JOB,
    label: saying('server.jobs.jobDefinitions.bringEverythingAcross'),
    group: 'library',
    description: saying('server.jobs.jobDefinitions.bringsPeopleWatchingAndLibrariesAcross'),
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: false,
    schedulable: false,
  },
];

const DEFAULT_JOB_TRIGGERS: Record<string, ScheduleTrigger[]> = {
  [SCAN_LIBRARY_JOB]: [{ kind: 'daily', hour: 3, minute: 0 }],
  [CHECK_CATALOGUE_CONNECTIVITY_JOB]: [{ kind: 'daily', hour: 5, minute: 0 }],
  [CHECK_TRANSCODER_JOB]: [{ kind: 'everyMinutes', minutes: 5 }],
  [CHECK_DISK_SPACE_JOB]: [{ kind: 'everyMinutes', minutes: 15 }],
  [SYNC_LINKED_CATALOGUES_JOB]: [{ kind: 'everyMinutes', minutes: 15 }],
  [CHECK_REQUESTS_JOB]: [{ kind: 'everyMinutes', minutes: 5 }],
  [REFRESH_REQUESTS_JOB]: [{ kind: 'daily', hour: 4, minute: 30 }],
  [SEND_MEDIA_DIGEST_JOB]: [{ kind: 'everyHours', hours: 1 }],
  [CLEANUP_SESSIONS_JOB]: [{ kind: 'daily', hour: 5, minute: 30 }],
  [CLEAR_OLD_DOWNLOADS_JOB]: [{ kind: 'daily', hour: 5, minute: 40 }],
  [PRUNE_WEBHOOK_DELIVERIES_JOB]: [{ kind: 'daily', hour: 5, minute: 45 }],
  [PRUNE_LOGS_JOB]: [{ kind: 'daily', hour: 5, minute: 55 }],
  [PRUNE_JOB_HISTORY_JOB]: [{ kind: 'daily', hour: 6, minute: 5 }],
  [PRUNE_RESOURCE_HISTORY_JOB]: [{ kind: 'daily', hour: 6, minute: 10 }],
  [PRE_TRANSCODE_JOB]: [{ kind: 'everyMinutes', minutes: 15 }],
  [FETCH_SUBTITLES_JOB]: [{ kind: 'daily', hour: 2, minute: 30 }],
  [CLEANUP_IMAGE_CACHE_JOB]: [{ kind: 'weekly', dayOfWeek: 0, hour: 6, minute: 0 }],
  [CLEANUP_ARTEFACT_CACHE_JOB]: [{ kind: 'weekly', dayOfWeek: 0, hour: 6, minute: 30 }],
};

/**
 * Names the queue a kind's schedule fires on. A library-scoped job runs once per library, so its
 * schedule cannot fire on the job's own queue — it fires on a queue of its own, whose worker fans it
 * out across every library that exists at the time.
 *
 * @param kind - The kind of job being scheduled.
 * @returns The queue its schedule should fire on.
 */
const scheduleQueueNameFor = (kind: string): string => {
  const definition = JOB_DEFINITIONS.find((candidate) => candidate.kind === kind);

  return definition?.needsLibrary === true ? scheduleTriggerKind(kind) : kind;
};

const REQUESTS_JOB_KINDS: readonly string[] = [CHECK_REQUESTS_JOB, REFRESH_REQUESTS_JOB];

/**
 * The jobs this server offers, which leaves out the ones that speak to the requests service where
 * requesting is off — there is nothing for them to check.
 *
 * @param hasRequests - Whether requesting is on.
 * @returns The definitions to offer.
 */
const jobDefinitionsFor = (hasRequests: boolean): JobDefinition[] =>
  hasRequests
    ? JOB_DEFINITIONS
    : JOB_DEFINITIONS.filter((definition) => !REQUESTS_JOB_KINDS.includes(definition.kind));

const JobRunRequestSchema = z.object({
  libraryId: z.string().uuid().optional(),
  force: z.boolean().optional(),
  parts: z.array(LibraryPartSchema).min(1).optional(),
});

export type { JobDefinition };

export {
  JOB_DEFINITIONS,
  DEFAULT_JOB_TRIGGERS,
  JobRunRequestSchema,
  RESET_LIBRARY_JOB,
  jobDefinitionsFor,
  scheduleQueueNameFor,
};
