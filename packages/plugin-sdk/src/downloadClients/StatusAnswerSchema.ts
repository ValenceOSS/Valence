import { z } from 'zod';
import { DownloadStatusSchema } from './DownloadStatusSchema';
import { MOST_ASKED_AT_ONCE } from './StatusAskSchema';

const StatusAnswerSchema = z.object({
  items: z.array(DownloadStatusSchema).max(MOST_ASKED_AT_ONCE),
});

type StatusAnswer = z.infer<typeof StatusAnswerSchema>;

export type { StatusAnswer };

export { StatusAnswerSchema };
