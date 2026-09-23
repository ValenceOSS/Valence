import { z } from 'zod';

const PageAnswerSchema = z.object({
  url: z.string(),
  status: z.number().int(),
  headers: z.record(z.string(), z.string()),
  dataUrl: z.string(),
});

type PageAnswer = z.infer<typeof PageAnswerSchema>;

export type { PageAnswer };

export { PageAnswerSchema };
