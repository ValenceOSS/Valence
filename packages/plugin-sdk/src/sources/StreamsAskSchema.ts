import { z } from 'zod';
import { InfoHashSchema } from '@ValenceSDK/remoteFiles/InfoHashSchema';
import { StreamTitleSchema } from './StreamTitleSchema';

const MOST_CANDIDATES = 300;

const StreamsAskSchema = z.object({
  title: StreamTitleSchema,
  candidates: z
    .array(
      z.object({
        infoHash: InfoHashSchema,
        name: z.string().min(1).max(500),
        sizeBytes: z.number().int().nonnegative().nullable(),
        seeders: z.number().int().nonnegative().nullable(),
      }),
    )
    .max(MOST_CANDIDATES),
});

type StreamsAsk = z.infer<typeof StreamsAskSchema>;

export type { StreamsAsk };

export { MOST_CANDIDATES, StreamsAskSchema };
