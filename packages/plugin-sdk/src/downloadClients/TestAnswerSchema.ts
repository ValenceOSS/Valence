import { z } from 'zod';
import { RefusedSchema } from '@ValenceSDK/remoteFiles/RefusedSchema';

const TestAnswerSchema = z.union([
  z.object({
    version: z.string().max(100).nullable().default(null),
    note: z.string().max(200).nullable().default(null),
  }),
  RefusedSchema,
]);

type TestAnswer = z.infer<typeof TestAnswerSchema>;

export type { TestAnswer };

export { TestAnswerSchema };
