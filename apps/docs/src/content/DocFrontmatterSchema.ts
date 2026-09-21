import { z } from 'zod';

const DocFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
});

type DocFrontmatter = z.infer<typeof DocFrontmatterSchema>;

export type { DocFrontmatter };

export { DocFrontmatterSchema };
