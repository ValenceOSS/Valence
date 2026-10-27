import { z } from 'zod';
import { RefusedSchema } from '@ValenceSDK/remoteFiles/RefusedSchema';
import { DownloadIdSchema } from './DownloadIdSchema';

const AddAnswerSchema = z.union([z.object({ id: DownloadIdSchema }), RefusedSchema]);

type AddAnswer = z.infer<typeof AddAnswerSchema>;

export type { AddAnswer };

export { AddAnswerSchema };
