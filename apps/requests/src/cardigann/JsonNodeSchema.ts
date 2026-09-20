import { z } from 'zod';
import type { JsonNode } from '@ValenceRequests/cardigann/JsonNode';

const JsonNodeSchema: z.ZodType<JsonNode> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonNodeSchema),
    z.record(z.string(), JsonNodeSchema),
  ]),
);

export { JsonNodeSchema };
