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
  CHECK_CATALOGUE_CONNECTIVITY_JOB,
  CHECK_TRANSCODER_JOB,
  CHECK_DISK_SPACE_JOB,
  CHECK_REQUESTS_JOB,
  SEND_MEDIA_DIGEST_JOB,
  PRUNE_WEBHOOK_DELIVERIES_JOB,
  PRUNE_LOGS_JOB,
  PRUNE_JOB_HISTORY_JOB,
  PRUNE_RESOURCE_HISTORY_JOB,
  scheduleTriggerKind,
} from './JobQueue';
import type { ScheduleTrigger } from './scheduleTrigger';

const RESET_LIBRARY_JOB = 'library.reset';

type JobDefinition = {
  kind: string;
  label: string;
  description: string;
  needsLibrary: boolean;
  destructive: boolean;
  takesParts: boolean;
  announcesFinish: boolean;
};

const JOB_DEFINITIONS: JobDefinition[] = [
  {
    kind: SCAN_LIBRARY_JOB,
    label: 'Scan for changes',
    description:
      'Finds new, changed and removed files, then makes whatever they are still missing.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: REGENERATE_PREVIEWS_JOB,
    label: 'Generate missing previews',
    description:
      "Renders preview clips for items that have none, using each library's forced audio language. Skips items that already have one.",
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: REGENERATE_TRICKPLAY_JOB,
    label: 'Generate missing scrub previews',
    description:
      'Renders the strip of images shown when scrubbing the seek bar, for items that have none. Skips items that already have one.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: FETCH_LOGOS_JOB,
    label: 'Fetch missing logos',
    description:
      "Collects the lettering each title is written in, so a hero shows the programme's own logo rather than its name set in the interface's typeface. Skips items that already have one, and items no catalogue has named.",
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: DETECT_SEGMENTS_JOB,
    label: 'Detect missing intros and outros',
    description:
      'Finds the intro and the recap in each episode by comparing the audio across a season, so viewers can skip them. Skips seasons already done.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: RESET_LIBRARY_JOB,
    label: 'Reset and rebuild',
    description:
      'Deletes every item in every library and starts again from nothing: scanning, then everything each item needs made for it. Hours of work on a large library.',
    needsLibrary: true,
    destructive: true,
    takesParts: false,
    announcesFinish: true,
  },
  {
    kind: CLEAR_LIBRARY_PARTS_JOB,
    label: 'Clear and fetch again',
    description:
      'Erases the chosen parts of a library, such as descriptions, artwork, trailers or preview clips, then fetches or makes them again from scratch. Everything else is left alone.',
    needsLibrary: true,
    destructive: true,
    takesParts: true,
    announcesFinish: true,
  },
  {
    kind: CLEANUP_IMAGE_CACHE_JOB,
    label: 'Clean up cached images',
    description:
      'Removes cached artwork and profile photos nothing references any more, and the kept pages of books nobody has opened for 30 days.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CLEANUP_ARTEFACT_CACHE_JOB,
    label: 'Clean up cached previews',
    description:
      'Removes preview clips and scrub previews nothing addresses any more, freeing the space left behind by a reset or a change to how they are made.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_HISTORY_JOB,
    label: 'Prune old viewing history',
    description:
      'Forgets viewings older than a year. What each profile has watched recently stays; the rest is removed, because this log grows every evening and nobody reads back that far.',
    needsLibrary: false,
    destructive: true,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CLEANUP_SESSIONS_JOB,
    label: 'Clean up sessions',
    description: 'Clears out expired sign-in sessions and device-authorization codes.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_CATALOGUE_CONNECTIVITY_JOB,
    label: 'Check catalogue connectivity',
    description: 'Verifies the configured catalogue key can actually reach the catalogue.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_TRANSCODER_JOB,
    label: 'Check the transcoder',
    description:
      'Asks the transcoder whether it is still answering, so an operator hears about it going quiet from a notification rather than from somebody pressing play.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_DISK_SPACE_JOB,
    label: 'Check disk space',
    description:
      'Asks how much room is left on the filesystems Valence writes to, so a disk about to fill is something an operator hears about rather than something a scan discovers.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: CHECK_REQUESTS_JOB,
    label: 'Check the requests service',
    description:
      'Asks the requests service whether it is still answering, and whether the VPN it downloads through is up, so an operator hears about either going quiet from a notification.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: SEND_MEDIA_DIGEST_JOB,
    label: 'Tell the household about new media',
    description:
      'Collects what has been imported since the last time and says it once, so a scan of four hundred files is one notification rather than four hundred.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_LOGS_JOB,
    label: 'Prune old log records',
    description:
      'Forgets log records past the age their level is kept for, so errors outlive the ordinary chatter. A retention policy nobody enforces is a table that grows until the disk fills.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_WEBHOOK_DELIVERIES_JOB,
    label: 'Prune old webhook deliveries',
    description:
      'Forgets what was sent to webhook subscribers more than a week ago. Recent deliveries stay, so a receiver that has started failing is still visible; the rest goes, because this table gains a row for every event sent to everybody.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_JOB_HISTORY_JOB,
    label: 'Prune old job history',
    description:
      'Forgets job runs older than thirty days, and the per-item issues recorded against them.',
    needsLibrary: false,
    destructive: false,
    takesParts: false,
    announcesFinish: false,
  },
  {
    kind: PRUNE_RESOURCE_HISTORY_JOB,
    label: 'Prune old server load history',
    description: 'Forgets server load samples older than a week.',
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
  [SEND_MEDIA_DIGEST_JOB]: [{ kind: 'everyHours', hours: 1 }],
  [CLEANUP_SESSIONS_JOB]: [{ kind: 'daily', hour: 5, minute: 30 }],
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

const REQUESTS_JOB_KINDS: readonly string[] = [CHECK_REQUESTS_JOB];

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
