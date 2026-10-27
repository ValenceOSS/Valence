import { z } from 'zod';
import { StreamSchema } from './StreamSchema';
import { MOST_CANDIDATES } from './StreamsAskSchema';

const StreamsAnswerSchema = z.object({
  streams: z
    .array(StreamSchema)
    .max(MOST_CANDIDATES)
    .refine(
      (streams) => new Set(streams.map((stream) => stream.key)).size === streams.length,
      'Each stream has a key of its own',
    ),
});

type StreamsAnswer = z.infer<typeof StreamsAnswerSchema>;

export type { StreamsAnswer };

export { StreamsAnswerSchema };
