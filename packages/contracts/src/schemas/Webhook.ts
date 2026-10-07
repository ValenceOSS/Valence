import { z } from 'zod';
import {
  MediaRequestKindSchema,
  MediaRequestStateSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { MediaKindSchema } from './MediaKind';
import { PLAYBACK_MODES } from '@ValenceContracts/functions/describePlaybackMode';
import { say } from '@ValenceI18n/say';

const WEBHOOK_EVENTS = [
  'webhook.test',
  'job.completed',
  'job.failed',
  'job.stalled',
  'job.working',
  'library.scanned',
  'catalogue.unreachable',
  'catalogue.reachable',
  'transcoder.unreachable',
  'transcoder.reachable',
  'disk.low',
  'disk.recovered',
  'requests.unreachable',
  'requests.reachable',
  'requests.vpnDown',
  'requests.vpnUp',
  'requests.indexerFailing',
  'requests.indexerWorking',
  'requests.downloadStarted',
  'requests.downloadFailed',
  'requests.made',
  'requests.approved',
  'requests.refused',
  'requests.chosen',
  'requests.filed',
  'requests.available',
  'auth.succeeded',
  'auth.failed',
  'account.created',
  'account.deleted',
  'account.roleChanged',
  'session.started',
  'session.ended',
  'media.added',
  'media.removed',
  'playback.started',
  'playback.stopped',
  'plugin.event',
] as const;

const WebhookEventSchema = z.enum(WEBHOOK_EVENTS);

type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const WebhookSubscribableEventSchema = WebhookEventSchema.exclude(['webhook.test']);

const WEBHOOK_SUBSCRIBABLE_EVENTS = WebhookSubscribableEventSchema.options;

type WebhookSubscribableEvent = z.infer<typeof WebhookSubscribableEventSchema>;

/**
 * Whether an event is one somebody can subscribe to, as opposed to one Valence only ever sends by
 * itself. A subscription stored before an event stopped being offered still holds it, so anything
 * reading one back has to be able to tell.
 *
 * @param event - The event to judge.
 * @returns Whether a subscription may ask for it.
 */
const isSubscribableEvent = (event: WebhookEvent): event is WebhookSubscribableEvent =>
  WebhookSubscribableEventSchema.safeParse(event).success;

const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  'webhook.test': say('contracts.schemas.webhook.testDelivery'),
  'job.completed': say('contracts.schemas.webhook.jobFinished'),
  'job.failed': say('contracts.schemas.webhook.jobFailed'),
  'job.stalled': say('contracts.schemas.webhook.jobFailingEveryTime'),
  'job.working': say('contracts.schemas.webhook.jobWorkingAgain'),
  'library.scanned': say('contracts.schemas.webhook.libraryScanned'),
  'catalogue.unreachable': say('contracts.schemas.webhook.catalogueUnreachable'),
  'catalogue.reachable': say('contracts.schemas.webhook.catalogueReachable'),
  'transcoder.unreachable': say('contracts.schemas.webhook.transcoderUnreachable'),
  'transcoder.reachable': say('contracts.schemas.webhook.transcoderAnswering'),
  'disk.low': say('contracts.schemas.webhook.diskLowOnRoom'),
  'disk.recovered': say('contracts.schemas.webhook.diskHasRoom'),
  'requests.unreachable': say('contracts.schemas.webhook.requestsUnreachable'),
  'requests.reachable': say('contracts.schemas.webhook.requestsAnswering'),
  'requests.vpnDown': say('contracts.schemas.webhook.vPNDown'),
  'requests.vpnUp': say('contracts.schemas.webhook.vPNUp'),
  'requests.indexerFailing': say('contracts.schemas.webhook.indexerFailing'),
  'requests.indexerWorking': say('contracts.schemas.webhook.indexerWorkingAgain'),
  'requests.downloadStarted': say('contracts.schemas.webhook.downloadStarted'),
  'requests.downloadFailed': say('common.downloadFailed'),
  'requests.made': say('contracts.schemas.webhook.requestMade'),
  'requests.approved': say('contracts.schemas.webhook.requestApproved'),
  'requests.refused': say('contracts.schemas.webhook.requestRefused'),
  'requests.chosen': say('common.releaseChosen'),
  'requests.filed': say('contracts.schemas.webhook.requestFiled'),
  'requests.available': say('contracts.schemas.webhook.requestReady'),
  'auth.succeeded': say('common.signedIn'),
  'auth.failed': say('contracts.schemas.webhook.signInRefused'),
  'account.created': say('contracts.schemas.webhook.accountMade'),
  'account.deleted': say('contracts.schemas.webhook.accountDeleted'),
  'account.roleChanged': say('contracts.schemas.webhook.roleChanged'),
  'session.started': say('contracts.schemas.webhook.openedValence'),
  'session.ended': say('contracts.schemas.webhook.leftValence'),
  'media.added': say('contracts.schemas.webhook.somethingArrived'),
  'media.removed': say('contracts.schemas.webhook.somethingLeft'),
  'playback.started': say('contracts.schemas.webhook.startedWatching'),
  'playback.stopped': say('contracts.schemas.webhook.stoppedWatching'),
  'plugin.event': say('contracts.schemas.webhook.pluginReported'),
};

const WEBHOOK_EVENT_NOTES: Partial<Record<WebhookEvent, string>> = {
  'auth.failed': say('contracts.schemas.webhook.rateLimitedAttemptsAreRefusedBefore'),
  'requests.indexerFailing': say('contracts.schemas.webhook.sentAfterThreeFailuresInA'),
  'requests.downloadStarted': say('contracts.schemas.webhook.sentWhenAReleaseIsHanded'),
  'requests.available': say('contracts.schemas.webhook.sentOnceTheLibraryHasFound'),
  'playback.started': say('contracts.schemas.webhook.namesThePersonAndWhatThey2'),
  'playback.stopped': say('contracts.schemas.webhook.namesThePersonAndWhatThey'),
  'session.started': say('contracts.schemas.webhook.sentWhenSomebodyOpensValenceNot'),
  'session.ended': say('contracts.schemas.webhook.sentAMinuteAfterTheTab'),
  'plugin.event': say('contracts.schemas.webhook.sentWhenAnInstalledPluginReports'),
};

type WebhookEventGroup = {
  id: string;
  label: string;
  events: readonly WebhookSubscribableEvent[];
};

const WEBHOOK_EVENT_GROUPS: readonly WebhookEventGroup[] = [
  {
    id: 'server',
    label: say('contracts.schemas.webhook.theServer'),
    events: [
      'job.completed',
      'job.failed',
      'job.stalled',
      'job.working',
      'library.scanned',
      'catalogue.unreachable',
      'catalogue.reachable',
      'transcoder.unreachable',
      'transcoder.reachable',
      'disk.low',
      'disk.recovered',
    ],
  },
  {
    id: 'requests',
    label: say('common.requests'),
    events: [
      'requests.unreachable',
      'requests.reachable',
      'requests.vpnDown',
      'requests.vpnUp',
      'requests.indexerFailing',
      'requests.indexerWorking',
      'requests.downloadStarted',
      'requests.downloadFailed',
      'requests.made',
      'requests.approved',
      'requests.refused',
      'requests.chosen',
      'requests.filed',
      'requests.available',
    ],
  },
  {
    id: 'people',
    label: say('common.people'),
    events: [
      'auth.succeeded',
      'auth.failed',
      'account.created',
      'account.deleted',
      'account.roleChanged',
      'session.started',
      'session.ended',
    ],
  },
  {
    id: 'library',
    label: say('common.theLibrary'),
    events: ['media.added', 'media.removed'],
  },
  {
    id: 'watching',
    label: say('common.watching'),
    events: ['playback.started', 'playback.stopped'],
  },
  {
    id: 'plugins',
    label: say('common.plugins'),
    events: ['plugin.event'],
  },
];

const WEBHOOK_PAYLOAD_VERSION = 1;

const MEDIA_ADDED_GRANULARITIES = ['perItem', 'perScan'] as const;

const MediaAddedGranularitySchema = z.enum(MEDIA_ADDED_GRANULARITIES);

const WebhookFiltersSchema = z.object({
  mediaAdded: MediaAddedGranularitySchema.default('perScan'),
  accounts: z.array(z.string()).default([]),
  profiles: z.array(z.string()).default([]),
  itemTypes: z.array(MediaKindSchema).default([]),
});

type WebhookFilters = z.infer<typeof WebhookFiltersSchema>;

const DEFAULT_WEBHOOK_FILTERS = WebhookFiltersSchema.parse({});

const WebhookRequestSchema = z.object({
  id: z.string(),
  kind: MediaRequestKindSchema,
  title: z.string(),
  artistName: z.string().nullable(),
  year: z.number().int().nullable(),
  overview: z.string().nullable(),
  posterUrl: z.string().nullable(),
  requestedBy: z.string(),
  seasons: z.array(z.number().int().nonnegative()).nullable(),
  state: MediaRequestStateSchema,
});

type WebhookRequest = z.infer<typeof WebhookRequestSchema>;

const WITH_THE_REQUEST = { request: WebhookRequestSchema.nullable().default(null) };

const WebhookEnvelopeSchema = {
  version: z.literal(WEBHOOK_PAYLOAD_VERSION),
  id: z.string().uuid(),
  occurredAt: z.string().datetime(),
};

const WebhookJobDataSchema = z.object({
  kind: z.string(),
  label: z.string(),
  jobId: z.string(),
  subject: z.string().nullable(),
  subjectName: z.string().nullable(),
});

const DiskRoomSchema = z.object({
  mountPoint: z.string(),
  totalBytes: z.number().nonnegative(),
  availableBytes: z.number().nonnegative(),
});

const WebhookMediaSchema = z.object({
  itemId: z.string(),
  kind: MediaKindSchema,
  title: z.string(),
  seriesTitle: z.string().nullable(),
  seasonNumber: z.number().int().nullable(),
  episodeNumber: z.number().int().nullable(),
  year: z.number().int().nullable(),
  posterUrl: z.string().url().nullable(),
  libraryId: z.string(),
  libraryName: z.string(),
  overview: z.string().nullable().default(null),
  durationSeconds: z.number().nonnegative().nullable().default(null),
  genres: z.array(z.string()).default([]),
  rating: z.number().nullable().default(null),
  quality: z.string().nullable().default(null),
});

const WebhookViewerSchema = z.object({
  accountId: z.string().nullable(),
  accountName: z.string().nullable(),
  profileId: z.string().nullable(),
  profileName: z.string().nullable(),
});

const WebhookPlaybackSchema = WebhookViewerSchema.extend({
  item: WebhookMediaSchema,
  deviceLabel: z.string(),
  mode: z.enum(PLAYBACK_MODES),
});

const WebhookSessionSchema = WebhookViewerSchema.extend({
  clientId: z.string(),
  deviceLabel: z.string(),
  address: z.string().nullable().default(null),
  guestOf: z.string().nullable().default(null),
  viaShare: z.string().nullable().default(null),
});

const ARRIVED_TITLES_KEPT = 25;

const ArrivedTitleSchema = z.object({
  title: z.string(),
  episodes: z.number().int().positive(),
});

type ArrivedTitle = z.infer<typeof ArrivedTitleSchema>;

const ScannedLibrarySchema = z.object({
  libraryId: z.string(),
  libraryName: z.string(),
  added: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  arrived: z.array(ArrivedTitleSchema).max(ARRIVED_TITLES_KEPT).default([]),
  arrivedNotListed: z.number().int().nonnegative().default(0),
});

type ScannedLibrary = z.infer<typeof ScannedLibrarySchema>;

const WebhookPayloadSchema = z.discriminatedUnion('event', [
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('webhook.test'),
    data: z.object({}),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('job.completed'),
    data: WebhookJobDataSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('job.failed'),
    data: WebhookJobDataSchema.extend({ reason: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('job.stalled'),
    data: z.object({
      kind: z.string(),
      label: z.string(),
      failures: z.number().int().positive(),
      everSucceeded: z.boolean(),
      reason: z.string(),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('job.working'),
    data: z.object({ kind: z.string(), label: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('library.scanned'),
    data: z.object({
      libraries: z.array(ScannedLibrarySchema).min(1),
      added: z.number().int().nonnegative(),
      updated: z.number().int().nonnegative(),
      removed: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('catalogue.unreachable'),
    data: z.object({}),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('catalogue.reachable'),
    data: z.object({}),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('transcoder.unreachable'),
    data: z.object({ reason: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('transcoder.reachable'),
    data: z.object({}),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.unreachable'),
    data: z.object({ reason: z.string(), docs: z.string().nullable().default(null) }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.reachable'),
    data: z.object({}),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.vpnDown'),
    data: z.object({ reason: z.string(), docs: z.string().nullable().default(null) }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.vpnUp'),
    data: z.object({ publicAddress: z.string().nullable(), country: z.string().nullable() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.indexerFailing'),
    data: z.object({
      name: z.string(),
      problem: z.string(),
      docs: z.string().nullable().default(null),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.indexerWorking'),
    data: z.object({ name: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.downloadStarted'),
    data: z.object({ title: z.string(), client: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.downloadFailed'),
    data: z.object({ title: z.string(), client: z.string(), problem: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.made'),
    data: z.object({
      title: z.string(),
      kind: MediaRequestKindSchema,
      requestedBy: z.string(),
      ...WITH_THE_REQUEST,
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.approved'),
    data: z.object({ title: z.string(), approvedBy: z.string().nullable(), ...WITH_THE_REQUEST }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.refused'),
    data: z.object({ title: z.string(), reason: z.string().nullable(), ...WITH_THE_REQUEST }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.chosen'),
    data: z.object({ title: z.string(), release: z.string(), ...WITH_THE_REQUEST }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.filed'),
    data: z.object({ title: z.string(), folder: z.string(), ...WITH_THE_REQUEST }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('requests.available'),
    data: z.object({
      title: z.string(),
      requestedBy: z.string(),
      mediaId: z.string(),
      ...WITH_THE_REQUEST,
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('disk.low'),
    data: DiskRoomSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('disk.recovered'),
    data: DiskRoomSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('auth.succeeded'),
    data: z.object({
      accountId: z.string(),
      name: z.string(),
      deviceLabel: z.string(),
      address: z.string().nullable(),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('auth.failed'),
    data: z.object({
      identifier: z.string(),
      deviceLabel: z.string(),
      address: z.string().nullable(),
      reason: z.string(),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('account.created'),
    data: z.object({ accountId: z.string(), name: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('account.deleted'),
    data: z.object({ accountId: z.string(), name: z.string() }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('account.roleChanged'),
    data: z.object({
      accountId: z.string(),
      name: z.string(),
      role: z.string(),
      change: z.enum(['given', 'taken']),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('media.added'),
    data: WebhookMediaSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('media.removed'),
    data: WebhookMediaSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('playback.started'),
    data: WebhookPlaybackSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('playback.stopped'),
    data: WebhookPlaybackSchema.extend({
      positionSeconds: z.number().nonnegative().nullable(),
      durationSeconds: z.number().nonnegative().nullable(),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('session.started'),
    data: WebhookSessionSchema,
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('session.ended'),
    data: WebhookSessionSchema.extend({
      lastedSeconds: z.number().nonnegative(),
    }),
  }),
  z.object({
    ...WebhookEnvelopeSchema,
    event: z.literal('plugin.event'),
    data: z.object({
      pluginId: z.string(),
      pluginName: z.string(),
      name: z.string(),
      title: z.string(),
      detail: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    }),
  }),
]);

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

const WEBHOOK_PRESETS = ['generic', 'discord', 'ntfy'] as const;

const WebhookPresetSchema = z.enum(WEBHOOK_PRESETS);

type WebhookPreset = (typeof WEBHOOK_PRESETS)[number];

const WebhookDeliveryResultSchema = z.object({
  lastAttemptAt: z.string().datetime().nullable(),
  lastStatus: z.number().int().nullable(),
  lastError: z.string().nullable(),
});

const WebhookSubscriptionSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    url: z.string().url(),
    preset: WebhookPresetSchema,
    events: z.array(WebhookEventSchema).min(1),
    filters: WebhookFiltersSchema.prefault({}),
    enabled: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .merge(WebhookDeliveryResultSchema);

type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;

const WebhookDeliverySchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  event: WebhookEventSchema,
  attempts: z.number().int().positive(),
  firstAttemptAt: z.string().datetime(),
  lastAttemptAt: z.string().datetime(),
  ok: z.boolean(),
  status: z.number().int().nullable(),
  error: z.string().nullable(),
});

type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

export {
  ARRIVED_TITLES_KEPT,
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_NOTES,
  WEBHOOK_SUBSCRIBABLE_EVENTS,
  WebhookSubscribableEventSchema,
  isSubscribableEvent,
  DEFAULT_WEBHOOK_FILTERS,
  MEDIA_ADDED_GRANULARITIES,
  MediaAddedGranularitySchema,
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_PAYLOAD_VERSION,
  WEBHOOK_PRESETS,
  WebhookDeliveryResultSchema,
  WebhookDeliverySchema,
  WebhookEventSchema,
  WebhookFiltersSchema,
  WebhookJobDataSchema,
  WebhookPayloadSchema,
  WebhookSessionSchema,
  WebhookRequestSchema,
  ArrivedTitleSchema,
  ScannedLibrarySchema,
  WebhookPresetSchema,
  WebhookSubscriptionSchema,
};

export type {
  ArrivedTitle,
  WebhookRequest,
  ScannedLibrary,
  WebhookSubscribableEvent,
  WebhookEventGroup,
  WebhookDelivery,
  WebhookEvent,
  WebhookFilters,
  WebhookPayload,
  WebhookPreset,
  WebhookSubscription,
};
