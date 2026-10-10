import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const SubtitleError = RefusalSchema.openapi('SubtitleError');

const SubtitleTrackSchema = z
  .object({
    id: z.string(),
    language: z.string().nullable(),
    label: z.string(),
    format: z.string(),
    isForced: z.boolean(),
    isHearingImpaired: z.boolean(),
    delivery: z.enum(['text', 'burnIn']).default('text'),
    streamIndex: z.number().int().nullable().default(null),
  })
  .openapi('SubtitleTrack');

const SubtitleListSchema = z
  .object({ tracks: z.array(SubtitleTrackSchema) })
  .openapi('SubtitleList');

const listSubtitlesRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/subtitles',
  tags: ['Subtitles'],
  summary: 'List the subtitle tracks available for an item',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'The tracks beside the file',
      content: { 'application/json': { schema: SubtitleListSchema } },
    },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: SubtitleError } },
    },
  },
});

const readSubtitleRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/subtitles/{trackId}',
  tags: ['Subtitles'],
  summary: 'Read one subtitle track as WebVTT',
  request: {
    params: z.object({ mediaId: z.string().uuid(), trackId: z.string().min(1) }),
    query: z.object({
      from: z.coerce.number().nonnegative().default(0),
    }),
  },
  responses: {
    200: { description: 'The track' },
    404: {
      description: 'No such track',
      content: { 'application/json': { schema: SubtitleError } },
    },
  },
});

const SubtitleSpanSchema = z
  .object({
    text: z.string(),
    fontFamily: z.string().nullable(),
    fontHeight: z.number().nullable(),
    colour: z.string().nullable(),
    opacity: z.number().nullable(),
    isBold: z.boolean(),
    isItalic: z.boolean(),
    isUnderlined: z.boolean(),
    isStruckThrough: z.boolean(),
  })
  .openapi('SubtitleSpan');

const SubtitleCueSchema = z
  .object({
    from: z.number(),
    to: z.number(),
    spans: z.array(SubtitleSpanSchema),
    alignment: z.number().int().min(1).max(9),
    position: z.object({ x: z.number(), y: z.number() }).nullable(),
    margins: z.object({ left: z.number(), right: z.number(), vertical: z.number() }),
    isSign: z.boolean(),
  })
  .openapi('SubtitleCue');

const SubtitleCuesSchema = z.object({ cues: z.array(SubtitleCueSchema) }).openapi('SubtitleCues');

const readSubtitleCuesRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/subtitles/{trackId}/cues',
  tags: ['Subtitles'],
  summary: 'Read one subtitle track as styled lines, for a track that carries styling',
  description:
    'Advanced SubStation scripts say where a line goes and what it is dressed in, which WebVTT ' +
    'cannot carry. A track with no styling of its own answers 404, and is read as WebVTT instead.',
  request: {
    params: z.object({ mediaId: z.string().uuid(), trackId: z.string().min(1) }),
    query: z.object({
      from: z.coerce.number().nonnegative().default(0),
    }),
  },
  responses: {
    200: {
      description: 'The lines, with what the script dressed them in',
      content: { 'application/json': { schema: SubtitleCuesSchema } },
    },
    404: {
      description: 'No such track, or a track that carries no styling',
      content: { 'application/json': { schema: SubtitleError } },
    },
  },
});

const readSubtitleScriptRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/subtitles/{trackId}/script',
  tags: ['Subtitles'],
  summary: 'Read one styled subtitle track as the Advanced SubStation script it is',
  description:
    'For a player that draws the script whole, with every effect, position and font it names. A ' +
    'track with no styling of its own answers 404.',
  request: {
    params: z.object({ mediaId: z.string().uuid(), trackId: z.string().min(1) }),
  },
  responses: {
    200: { description: 'The script, as text' },
    404: {
      description: 'No such track, or a track that carries no styling',
      content: { 'application/json': { schema: SubtitleError } },
    },
  },
});

const SubtitleFontsSchema = z.object({ fonts: z.array(z.string()) }).openapi('SubtitleFonts');

const listSubtitleFontsRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/fonts',
  tags: ['Subtitles'],
  summary: 'List the fonts a title carries for its own subtitles',
  description:
    'Typeset subtitles name fonts nobody has installed and carry them inside the file. Each is ' +
    'read by name from the route beside this one.',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'The fonts, by name',
      content: { 'application/json': { schema: SubtitleFontsSchema } },
    },
  },
});

const readSubtitleFontRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/fonts/{name}',
  tags: ['Subtitles'],
  summary: 'Read one font a title carries for its subtitles',
  request: { params: z.object({ mediaId: z.string().uuid(), name: z.string().min(1) }) },
  responses: {
    200: { description: 'The font file' },
    404: {
      description: 'No font by that name',
      content: { 'application/json': { schema: SubtitleError } },
    },
  },
});

export {
  SubtitleCuesSchema,
  SubtitleFontsSchema,
  listSubtitleFontsRoute,
  readSubtitleFontRoute,
  readSubtitleScriptRoute,
  SubtitleListSchema,
  listSubtitlesRoute,
  readSubtitleCuesRoute,
  readSubtitleRoute,
};
