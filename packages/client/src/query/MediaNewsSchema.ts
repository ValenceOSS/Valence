import { z } from 'zod';

const NamedSchema = z.array(z.string().min(1)).min(1);

const MediaNewsSchema = z.union([
  z.object({ event: z.literal('artwork'), mediaIds: NamedSchema }),
  z.object({ event: z.enum(['metadata', 'changed']), mediaIds: NamedSchema }),
  z.object({ event: z.literal('changed'), mediaId: z.string().min(1) }),
  z.object({ event: z.literal('collections') }),
  z.object({ event: z.literal('likeness') }),
]);

type MediaNewsPayload = z.infer<typeof MediaNewsSchema>;

export type { MediaNewsPayload };

export { MediaNewsSchema };
