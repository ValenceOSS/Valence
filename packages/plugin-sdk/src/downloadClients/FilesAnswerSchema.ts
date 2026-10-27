import { z } from 'zod';
import { RefusedSchema } from '@ValenceSDK/remoteFiles/RefusedSchema';
import { RemoteFileSchema } from '@ValenceSDK/remoteFiles/RemoteFileSchema';

const FilesAnswerSchema = z.union([
  z.object({
    files: z
      .array(RemoteFileSchema)
      .max(1000)
      .refine(
        (files) => new Set(files.map((file) => file.name)).size === files.length,
        'Each file is named once',
      ),
  }),
  RefusedSchema,
]);

type FilesAnswer = z.infer<typeof FilesAnswerSchema>;

export type { FilesAnswer };

export { FilesAnswerSchema };
