import { z } from 'zod';
import { BookContentsSchema } from '@ValenceContracts/schemas/Book';
import { TypesetBlockSchema } from '@ValenceContracts/schemas/BookText';

const KeptBookTextSchema = z.object({
  version: z.number().int(),
  stamp: z.string(),
  contents: BookContentsSchema.shape.contents,
  parts: z.array(z.object({ blocks: z.array(TypesetBlockSchema), html: z.string() })),
});

type KeptBookText = z.infer<typeof KeptBookTextSchema>;

export type { KeptBookText };

export { KeptBookTextSchema };
