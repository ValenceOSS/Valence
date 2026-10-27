import { z } from 'zod';
import { DownloadIdSchema } from './DownloadIdSchema';

const DownloadAskSchema = z.object({ id: DownloadIdSchema });

type DownloadAsk = z.infer<typeof DownloadAskSchema>;

export type { DownloadAsk };

export { DownloadAskSchema };
