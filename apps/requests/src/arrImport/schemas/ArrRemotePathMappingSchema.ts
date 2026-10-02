import { z } from 'zod';

const ArrRemotePathMappingSchema = z.object({
  host: z.string(),
  remotePath: z.string(),
  localPath: z.string(),
});

type ArrRemotePathMapping = z.infer<typeof ArrRemotePathMappingSchema>;

export type { ArrRemotePathMapping };

export { ArrRemotePathMappingSchema };
