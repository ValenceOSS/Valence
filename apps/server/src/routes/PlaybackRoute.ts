import { KeptCopySchema } from '@ValenceContracts/schemas/KeptCopy';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  PlaybackProblemReportSchema,
  PlaybackProblemSchema,
} from '@ValenceContracts/schemas/PlaybackProblem';
import { PlaybackPlanSchema } from '@ValenceContracts/schemas/PlaybackPlan';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import { ConvertedSchema } from '@ValenceContracts/schemas/Converted';
import { TranscodeReuseSchema } from '@ValenceContracts/schemas/TranscodeReuse';
import { PLAYBACK_MODES } from '@ValenceContracts/functions/describePlaybackMode';
const PlaybackError = RefusalSchema.openapi('PlaybackError');

const PlaybackRefusal = RefusalSchema.extend({ problem: PlaybackProblemSchema }).openapi(
  'PlaybackRefusal',
);

const ExplainResponse = z
  .object({ mode: z.enum(PLAYBACK_MODES), plan: PlaybackPlanSchema })
  .openapi('PlaybackExplainResponse');

const StartRequest = z
  .object({
    deviceProfile: DeviceProfileSchema,
    clientId: z.string().min(1).optional(),
    startSeconds: z.number().int().nonnegative().optional(),
    audioStreamIndex: z.number().int().nonnegative().optional(),
    subtitleStreamIndex: z.number().int().nonnegative().optional(),
    burnInSubtitleId: z.string().min(1).optional(),
    requestedQuality: QualityStepIdSchema.optional(),
    isAdaptive: z.boolean().optional(),
    converted: ConvertedSchema.optional(),
    isCast: z
      .boolean()
      .optional()
      .describe(
        'Whether a device this client casts to will play it, such as a Chromecast. That device has no session of its own, so it is always sent a stream and never the file itself.',
      ),
  })
  .openapi('PlaybackStartRequest');

const ExplainRequest = StartRequest.omit({ converted: true, isCast: true }).openapi(
  'PlaybackExplainRequest',
);

const DeliverySchema = z
  .union([
    z.object({
      kind: z.literal('hls'),
      manifestUrl: z.string(),
      dashUrl: z.string().nullable().default(null),
    }),
    z.object({ kind: z.literal('direct'), url: z.string() }),
  ])
  .openapi('PlaybackDelivery');

const StartResponse = z
  .object({
    sessionId: z.string(),
    delivery: DeliverySchema,
    mode: z.enum(PLAYBACK_MODES),
    plan: PlaybackPlanSchema,
    warnings: z.array(SaidSchema),
    reuse: TranscodeReuseSchema.nullable(),
    keptCopies: z.array(KeptCopySchema).default([]),
  })
  .openapi('PlaybackStartResponse');

const explainRoute = createRoute({
  method: 'post',
  path: '/api/playback/{mediaId}/explain',
  tags: ['Playback'],
  summary: 'Explain how an item would be played, without starting a session',
  request: {
    params: z.object({ mediaId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: ExplainRequest } } },
  },
  responses: {
    200: {
      description: 'The plan negotiation would produce',
      content: { 'application/json': { schema: ExplainResponse } },
    },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const startRoute = createRoute({
  method: 'post',
  path: '/api/playback/{mediaId}/session',
  tags: ['Playback'],
  summary: 'Start a playback session',
  request: {
    params: z.object({ mediaId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: StartRequest } } },
  },
  responses: {
    200: {
      description: 'The session, and why it is shaped the way it is',
      content: { 'application/json': { schema: StartResponse } },
    },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: PlaybackRefusal } },
    },
    422: {
      description: 'This server cannot produce a stream this client can play',
      content: { 'application/json': { schema: PlaybackRefusal } },
    },
    429: {
      description: 'This account is already streaming as many times as it may at once',
      content: { 'application/json': { schema: PlaybackRefusal } },
    },
    500: {
      description: 'The media service could not start',
      content: { 'application/json': { schema: PlaybackRefusal } },
    },
  },
});

const sessionFileRoute = createRoute({
  method: 'get',
  path: '/api/playback/session/{sessionId}/{name}',
  tags: ['Playback'],
  summary: 'Read a manifest or segment from a session',
  request: {
    params: z.object({ sessionId: z.string().min(1), name: z.string().min(1) }),
  },
  responses: {
    200: { description: 'The manifest or segment' },
    403: {
      description: 'That session belongs to somebody else',
      content: { 'application/json': { schema: PlaybackError } },
    },
    404: {
      description: 'No such session or segment',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const castRoute = createRoute({
  method: 'post',
  path: '/api/playback/session/{sessionId}/cast',
  tags: ['Playback'],
  summary: 'Get an address for a device being cast to',
  description:
    'A device being cast to, such as a Chromecast, has no session of its own, so it cannot read the session the address of which it is handed. This answers an address for the same session that carries a ticket instead, good for that session only and for a few hours.',
  request: {
    params: z.object({ sessionId: z.string().min(1) }),
  },
  responses: {
    200: {
      description: 'The address to hand the device',
      content: {
        'application/json': {
          schema: z.object({ manifestUrl: z.string() }).openapi('PlaybackCastAddress'),
        },
      },
    },
    403: {
      description: 'That session belongs to somebody else',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const castFileRoute = createRoute({
  method: 'get',
  path: '/api/playback/cast/{ticket}/{name}',
  tags: ['Playback'],
  summary: 'Read a manifest or segment for a device being cast to',
  request: {
    params: z.object({ ticket: z.string().min(1), name: z.string().min(1) }),
  },
  responses: {
    200: { description: 'The manifest or segment' },
    404: {
      description: 'No such ticket, session or segment',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const stopRoute = createRoute({
  method: 'delete',
  path: '/api/playback/session/{sessionId}',
  tags: ['Playback'],
  summary: 'Stop a playback session',
  request: {
    params: z.object({ sessionId: z.string().min(1) }),
    query: z.object({ clientId: z.string().min(1).optional() }),
  },
  responses: {
    204: { description: 'The session was stopped' },
    403: {
      description: 'The device named belongs to another account',
      content: { 'application/json': { schema: PlaybackError } },
    },
    404: {
      description: 'No such session',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const HeartbeatRequest = z
  .object({
    isPlaying: z.boolean(),
  })
  .openapi('PlaybackHeartbeatRequest');

const heartbeatRoute = createRoute({
  method: 'post',
  path: '/api/playback/session/{sessionId}/heartbeat',
  tags: ['Playback'],
  summary: 'Report that a session is still wanted, and whether it is playing',
  request: {
    params: z.object({ sessionId: z.string().min(1) }),
    query: z.object({ clientId: z.string().min(1).optional() }),
    body: { content: { 'application/json': { schema: HeartbeatRequest } } },
  },
  responses: {
    204: { description: 'The heartbeat was recorded' },
    403: {
      description: 'The device named belongs to another account',
      content: { 'application/json': { schema: PlaybackError } },
    },
    404: {
      description: 'No such session',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const problemRoute = createRoute({
  method: 'post',
  path: '/api/playback/problems',
  tags: ['Playback'],
  summary: 'Report what stopped something playing, for the server log and its admin',
  request: {
    query: z.object({ clientId: z.string().min(1).optional() }),
    body: { content: { 'application/json': { schema: PlaybackProblemReportSchema } } },
  },
  responses: {
    204: { description: 'The report was written to the server log' },
    403: {
      description: 'The device named belongs to another account',
      content: { 'application/json': { schema: PlaybackError } },
    },
    429: {
      description: 'This device has reported too many problems lately',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const directFileRoute = createRoute({
  method: 'get',
  path: '/api/playback/{mediaId}/file',
  tags: ['Playback'],
  summary: 'Stream the original file, or a copy kept alongside it, for direct play',
  request: {
    params: z.object({ mediaId: z.string().uuid() }),
    query: z.object({ rendition: z.string().uuid().optional() }),
  },
  responses: {
    200: { description: 'The whole file' },
    206: { description: 'The requested byte range' },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const TrickplayResponse = z
  .object({
    id: z.string(),
    url: z.string(),
    intervalSeconds: z.number(),
    tileWidth: z.number(),
    tileHeight: z.number(),
  })
  .openapi('TrickplayResponse');

const trickplayRoute = createRoute({
  method: 'post',
  path: '/api/playback/{mediaId}/trickplay',
  tags: ['Playback'],
  summary: 'Render seek-bar preview thumbnails',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Where to find the thumbnails',
      content: { 'application/json': { schema: TrickplayResponse } },
    },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: PlaybackError } },
    },
    500: {
      description: 'The thumbnails could not be rendered',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const frameRoute = createRoute({
  method: 'get',
  path: '/api/playback/{mediaId}/frame',
  tags: ['Playback'],
  summary: 'Read a single frame as a picture',
  request: {
    params: z.object({ mediaId: z.string().uuid() }),
    query: z.object({
      seconds: z.coerce.number().int().nonnegative().default(0),
      width: z.coerce.number().int().positive().max(3840).default(1280),
    }),
  },
  responses: {
    200: { description: 'The frame' },
    404: {
      description: 'No such media item, or no frame there',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

const trickplayFileRoute = createRoute({
  method: 'get',
  path: '/api/playback/trickplay/{trickplayId}/{name}',
  tags: ['Playback'],
  summary: 'Read a thumbnail index or sheet',
  request: {
    params: z.object({ trickplayId: z.string().min(1), name: z.string().min(1) }),
  },
  responses: {
    200: { description: 'The index or sheet' },
    404: {
      description: 'No such thumbnails',
      content: { 'application/json': { schema: PlaybackError } },
    },
  },
});

export {
  ExplainResponse,
  StartResponse,
  TrickplayResponse,
  explainRoute,
  startRoute,
  sessionFileRoute,
  castRoute,
  castFileRoute,
  directFileRoute,
  trickplayRoute,
  trickplayFileRoute,
  frameRoute,
  stopRoute,
  heartbeatRoute,
  problemRoute,
};
