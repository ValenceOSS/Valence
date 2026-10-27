import { z } from 'zod';

const DownloadIdSchema = z.string().min(1).max(200);

export { DownloadIdSchema };
