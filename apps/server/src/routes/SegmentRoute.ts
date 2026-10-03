import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { SEGMENT_KINDS, SEGMENT_SOURCES } from '@ValenceContracts/schemas/MediaSegment';

const SegmentError = RefusalSchema.openapi('SegmentError');

const SegmentSchema = z
  .object({
    kind: z.enum(SEGMENT_KINDS),
    startSeconds: z.number(),
    endSeconds: z.number(),
    source: z.enum(SEGMENT_SOURCES),
  })
  .openapi('MediaSegment');

const SegmentListSchema = z.object({ segments: z.array(SegmentSchema) }).openapi('SegmentList');

const listSegmentsRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/segments',
  tags: ['Playback'],
  summary: 'List the intro, recap and credits ranges known for an item',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'What is known about this item',
      content: { 'application/json': { schema: SegmentListSchema } },
    },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: SegmentError } },
    },
  },
});

export { SegmentListSchema, listSegmentsRoute };
