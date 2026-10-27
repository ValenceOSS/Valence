import { z } from 'zod';
import { DownloadIdSchema } from './DownloadIdSchema';

const MOST_ASKED_AT_ONCE = 200;

const StatusAskSchema = z.object({ ids: z.array(DownloadIdSchema).max(MOST_ASKED_AT_ONCE) });

type StatusAsk = z.infer<typeof StatusAskSchema>;

export type { StatusAsk };

export { MOST_ASKED_AT_ONCE, StatusAskSchema };
