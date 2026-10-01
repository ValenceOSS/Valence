import { z } from 'zod';

const ProwlarrIndexerSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  enable: z.boolean().default(true),
  protocol: z.string(),
  priority: z.number().int().default(25),
  capabilities: z
    .object({
      categories: z
        .array(
          z.object({
            id: z.number().int(),
            subCategories: z.array(z.object({ id: z.number().int() })).default([]),
          }),
        )
        .default([]),
    })
    .nullish(),
});

type ProwlarrIndexer = z.infer<typeof ProwlarrIndexerSchema>;

export type { ProwlarrIndexer };

export { ProwlarrIndexerSchema };
