import { z } from 'zod';
import { HttpsUrlSchema } from '@ValenceSDK/manifest/HttpsUrlSchema';
import { RemoteRefusalSchema } from '@ValenceSDK/remoteFiles/RemoteRefusalSchema';

const ResolveAnswerSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ready'),
    url: HttpsUrlSchema,
    fileName: z.string().min(1).max(500),
    sizeBytes: z.number().int().positive(),
    expiresAt: z.iso.datetime({ offset: true }).nullable().default(null),
  }),
  z.object({
    kind: z.literal('preparing'),
    progress: z.number().min(0).max(1).nullable().default(null),
  }),
  RemoteRefusalSchema.extend({ kind: z.literal('refused') }),
]);

type ResolveAnswer = z.infer<typeof ResolveAnswerSchema>;

export type { ResolveAnswer };

export { ResolveAnswerSchema };
