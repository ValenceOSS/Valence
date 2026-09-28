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
  label: string;
  group: JobGroup;
  description: string;
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
    label: 'Scan for changes',
    group: 'library',
    description: 'Finds new, changed and removed files.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REGENERATE_PREVIEWS_JOB,
    label: 'Generate missing previews',
    group: 'library',
    description: 'Renders preview clips for items without one.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REGENERATE_TRICKPLAY_JOB,
    label: 'Generate missing scrub previews',
    group: 'library',
    description: 'Renders seek-bar thumbnails for items without them.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: FETCH_LOGOS_JOB,
    label: 'Fetch missing logos',
    group: 'library',
    description: 'Fetches title logos from TMDB.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: DETECT_SEGMENTS_JOB,
    label: 'Detect missing intros and outros',
    group: 'library',
    description: 'Finds intros and recaps so viewers can skip them.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: RESET_LIBRARY_JOB,
    label: 'Reset and rebuild',
    group: 'reset',
    description: 'Deletes every library item and rebuilds from scratch. Takes hours.',
    needsLibrary: true,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
    runsByHand: true,
    schedulable: false,
  },
  {
    kind: CLEAR_LIBRARY_PARTS_JOB,
    label: 'Clear and fetch again',
    group: 'reset',
    description:
      'Erases chosen parts of a library, like artwork or trailers, and fetches them again.',
    needsLibrary: true,
    destructive: true,
    takesParts: true,
    announcesFinish: true,
    runsByHand: true,
    schedulable: false,
  },
  {
    kind: CLEANUP_IMAGE_CACHE_JOB,
    label: 'Clean up cached images',
    group: 'housekeeping',
    description: 'Deletes cached artwork and book pages nothing uses.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CLEANUP_ARTEFACT_CACHE_JOB,
    label: 'Clean up cached previews',
    group: 'housekeeping',
    description: 'Deletes preview clips and thumbnails nothing uses.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_HISTORY_JOB,
    label: 'Prune old viewing history',
    group: 'housekeeping',
    description: 'Forgets viewings older than a year.',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CLEANUP_SESSIONS_JOB,
    label: 'Clean up sessions',
    group: 'housekeeping',
    description: 'Clears expired sign-ins.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CLEAR_OLD_DOWNLOADS_JOB,
    label: 'Clear out old downloads',
    group: 'housekeeping',
    description: 'Deletes offline downloads nobody has fetched in a while.',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_CATALOGUE_CONNECTIVITY_JOB,
    label: 'Check catalogue connectivity',
    group: 'health',
    description: 'Checks the TMDB key still works.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_TRANSCODER_JOB,
    label: 'Check the transcoder',
    group: 'health',
    description: 'Checks the transcoder is still answering.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_DISK_SPACE_JOB,
    label: 'Check disk space',
    group: 'health',
    description: 'Warns before a disk fills up.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: CHECK_REQUESTS_JOB,
    label: 'Check the requests service',
    group: 'health',
    description: 'Checks the requests service and its VPN are up.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REFRESH_REQUESTS_JOB,
    label: 'Bring requests up to date with the catalogue',
    group: 'requests',
    description: 'Checks TMDB for new episodes and changed release dates.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: SEND_MEDIA_DIGEST_JOB,
    label: 'Tell the household about new media',
    group: 'notifications',
    description: 'Sends one notification for everything newly added.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_LOGS_JOB,
    label: 'Prune old log records',
    group: 'housekeeping',
    description: 'Deletes log records past their retention.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_WEBHOOK_DELIVERIES_JOB,
    label: 'Prune old webhook deliveries',
    group: 'housekeeping',
    description: 'Forgets webhook deliveries older than a week.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: PRUNE_JOB_HISTORY_JOB,
    label: 'Prune old job history',
    group: 'housekeeping',
    description: 'Forgets job runs older than 30 days.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: REENCODE_JOB,
    label: 'Work through the re-encoding queue',
    group: 'library',
    description: 'Makes the re-encodes an administrator asked for.',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
    runsByHand: false,
    schedulable: false,
  },
  {
    kind: PRUNE_RESOURCE_HISTORY_JOB,
    label: 'Prune old server load history',
    group: 'housekeeping',
    description: 'Forgets server load samples older than a week.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
    runsByHand: true,
    schedulable: true,
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
