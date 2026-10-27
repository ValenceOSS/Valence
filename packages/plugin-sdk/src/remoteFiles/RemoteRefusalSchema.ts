import { z } from 'zod';
import { REMOTE_REFUSAL_REASONS } from './REMOTE_REFUSAL_REASONS';

const RemoteRefusalSchema = z.object({
  reason: z.enum(REMOTE_REFUSAL_REASONS),
  message: z.string().max(300).nullable().default(null),
});

type RemoteRefusal = z.infer<typeof RemoteRefusalSchema>;

type RemoteRefusalReason = RemoteRefusal['reason'];

export type { RemoteRefusal, RemoteRefusalReason };

export { RemoteRefusalSchema };
