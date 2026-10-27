import { z } from 'zod';
import { StreamSchema } from './StreamSchema';
import { StreamTitleSchema } from './StreamTitleSchema';

const ResolveAskSchema = z.object({
  title: StreamTitleSchema,
  stream: StreamSchema.pick({ key: true, name: true, infoHash: true, fileName: true }),
});

type ResolveAsk = z.infer<typeof ResolveAskSchema>;

export type { ResolveAsk };

export { ResolveAskSchema };
