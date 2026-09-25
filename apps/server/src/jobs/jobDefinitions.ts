import type { StringKey } from '@ValenceI18n/StringKey';
import { z } from 'zod';
import { LibraryPartSchema } from '@ValenceContracts/schemas/LibraryPart';
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
  CHECK_REQUESTS_JOB,
  REFRESH_REQUESTS_JOB,
  SEND_MEDIA_DIGEST_JOB,
  PRUNE_WEBHOOK_DELIVERIES_JOB,
  PRUNE_LOGS_JOB,
  PRUNE_JOB_HISTORY_JOB,
  PRUNE_RESOURCE_HISTORY_JOB,
  REENCODE_JOB,
  scheduleTriggerKind,
} from './JobQueue';
import type { ScheduleTrigger } from './scheduleTrigger';

const RESET_LIBRARY_JOB = 'library.reset';

type JobDefinition = {
  kind: string;
  labelKey: StringKey;
  descriptionKey: StringKey;
  needsLibrary: boolean;
  destructive: boolean;
  takesParts: boolean;
  announcesFinish: boolean;
};

const JOB_DEFINITIONS: JobDefinition[] = [
  {
    kind: SCAN_LIBRARY_JOB,
    labelKey: 'server.jobs.scanLibrary.label',
    descriptionKey: 'server.jobs.scanLibrary.description',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: REGENERATE_PREVIEWS_JOB,
    labelKey: 'server.jobs.regeneratePreviews.label',
    descriptionKey: 'server.jobs.regeneratePreviews.description',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: REGENERATE_TRICKPLAY_JOB,
    labelKey: 'server.jobs.regenerateTrickplay.label',
    descriptionKey: 'server.jobs.regenerateTrickplay.description',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: FETCH_LOGOS_JOB,
    labelKey: 'server.jobs.fetchLogos.label',
    descriptionKey: 'server.jobs.fetchLogos.description',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: DETECT_SEGMENTS_JOB,
    labelKey: 'server.jobs.detectSegments.label',
    descriptionKey: 'server.jobs.detectSegments.description',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: RESET_LIBRARY_JOB,
    labelKey: 'server.jobs.resetLibrary.label',
    descriptionKey: 'server.jobs.resetLibrary.description',
    needsLibrary: true,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: CLEAR_LIBRARY_PARTS_JOB,
    labelKey: 'server.jobs.clearLibraryParts.label',
    descriptionKey: 'server.jobs.clearLibraryParts.description',
    needsLibrary: true,
    destructive: true,
    takesParts: true,
    announcesFinish: true,
  },
  {
    kind: CLEANUP_IMAGE_CACHE_JOB,
    labelKey: 'server.jobs.cleanupImageCache.label',
    descriptionKey: 'server.jobs.cleanupImageCache.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CLEANUP_ARTEFACT_CACHE_JOB,
    labelKey: 'server.jobs.cleanupArtefactCache.label',
    descriptionKey: 'server.jobs.cleanupArtefactCache.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_HISTORY_JOB,
    labelKey: 'server.jobs.pruneHistory.label',
    descriptionKey: 'server.jobs.pruneHistory.description',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CLEANUP_SESSIONS_JOB,
    labelKey: 'server.jobs.cleanupSessions.label',
    descriptionKey: 'server.jobs.cleanupSessions.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CLEAR_OLD_DOWNLOADS_JOB,
    labelKey: 'server.jobs.clearOldDownloads.label',
    descriptionKey: 'server.jobs.clearOldDownloads.description',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_CATALOGUE_CONNECTIVITY_JOB,
    labelKey: 'server.jobs.checkCatalogueConnectivity.label',
    descriptionKey: 'server.jobs.checkCatalogueConnectivity.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_TRANSCODER_JOB,
    labelKey: 'server.jobs.checkTranscoder.label',
    descriptionKey: 'server.jobs.checkTranscoder.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_DISK_SPACE_JOB,
    labelKey: 'server.jobs.checkDiskSpace.label',
    descriptionKey: 'server.jobs.checkDiskSpace.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_REQUESTS_JOB,
    labelKey: 'server.jobs.checkRequests.label',
    descriptionKey: 'server.jobs.checkRequests.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: REFRESH_REQUESTS_JOB,
    labelKey: 'server.jobs.refreshRequests.label',
    descriptionKey: 'server.jobs.refreshRequests.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: SEND_MEDIA_DIGEST_JOB,
    labelKey: 'server.jobs.sendMediaDigest.label',
    descriptionKey: 'server.jobs.sendMediaDigest.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_LOGS_JOB,
    labelKey: 'server.jobs.pruneLogs.label',
    descriptionKey: 'server.jobs.pruneLogs.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_WEBHOOK_DELIVERIES_JOB,
    labelKey: 'server.jobs.pruneWebhookDeliveries.label',
    descriptionKey: 'server.jobs.pruneWebhookDeliveries.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_JOB_HISTORY_JOB,
    labelKey: 'server.jobs.pruneJobHistory.label',
    descriptionKey: 'server.jobs.pruneJobHistory.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: REENCODE_JOB,
    labelKey: 'server.jobs.reencode.label',
    descriptionKey: 'server.jobs.reencode.description',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: PRUNE_RESOURCE_HISTORY_JOB,
    labelKey: 'server.jobs.pruneResourceHistory.label',
    descriptionKey: 'server.jobs.pruneResourceHistory.description',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
];

const DEFAULT_JOB_TRIGGERS: Record<string, ScheduleTrigger[]> = {
  [SCAN_LIBRARY_JOB]: [{ kind: 'daily', hour: 3, minute: 0 }],
  [CHECK_CATALOGUE_CONNECTIVITY_JOB]: [{ kind: 'daily', hour: 5, minute: 0 }],
  [CHECK_TRANSCODER_JOB]: [{ kind: 'everyMinutes', minutes: 5 }],
  [CHECK_DISK_SPACE_JOB]: [{ kind: 'everyMinutes', minutes: 15 }],
  [CHECK_REQUESTS_JOB]: [{ kind: 'everyMinutes', minutes: 5 }],
  [REFRESH_REQUESTS_JOB]: [{ kind: 'daily', hour: 4, minute: 30 }],
  [SEND_MEDIA_DIGEST_JOB]: [{ kind: 'everyHours', hours: 1 }],
  [CLEANUP_SESSIONS_JOB]: [{ kind: 'daily', hour: 5, minute: 30 }],
  [CLEAR_OLD_DOWNLOADS_JOB]: [{ kind: 'daily', hour: 5, minute: 40 }],
  [PRUNE_WEBHOOK_DELIVERIES_JOB]: [{ kind: 'daily', hour: 5, minute: 45 }],
  [PRUNE_LOGS_JOB]: [{ kind: 'daily', hour: 5, minute: 55 }],
  [PRUNE_JOB_HISTORY_JOB]: [{ kind: 'daily', hour: 6, minute: 5 }],
  [PRUNE_RESOURCE_HISTORY_JOB]: [{ kind: 'daily', hour: 6, minute: 10 }],
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
