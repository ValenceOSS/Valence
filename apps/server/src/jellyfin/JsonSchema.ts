import { z } from 'zod';

type Json = string | number | boolean | null | Json[] | { [name: string]: Json };

const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(z.string(), JsonSchema),
  ]),
);

export type { Json };

export { JsonSchema };
