import { z } from 'zod';
import { InfoHashSchema } from '@ValenceSDK/remoteFiles/InfoHashSchema';

const StreamSchema = z.object({
  key: z.string().min(1).max(200),
  name: z.string().min(1).max(500),
  infoHash: InfoHashSchema.nullable().default(null),
  isReady: z.boolean(),
  sizeBytes: z.number().int().positive().nullable().default(null),
  fileName: z.string().min(1).max(500).nullable().default(null),
});

type Stream = z.infer<typeof StreamSchema>;

export type { Stream };

export { StreamSchema };
