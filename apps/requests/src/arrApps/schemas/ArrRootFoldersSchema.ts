import { z } from 'zod';

const ArrRootFoldersSchema = z.array(
  z.object({
    id: z.number().int(),
    path: z.string(),
    accessible: z.boolean().default(true),
    freeSpace: z.number().nonnegative().nullish(),
  }),
);

export { ArrRootFoldersSchema };
