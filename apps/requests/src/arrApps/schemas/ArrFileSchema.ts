import { z } from 'zod';

const ArrFileSchema = z.object({
  id: z.number().int(),
  path: z.string(),
  albumId: z.number().int().nullish(),
  sceneName: z.string().nullish().catch(null),
});

type ArrFile = z.infer<typeof ArrFileSchema>;

export type { ArrFile };

export { ArrFileSchema };
