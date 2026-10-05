import { z } from 'zod';

const AboutSchema = z.object({
  version: z.string().optional(),
  commit: z.string(),
  features: z.array(z.string()).default([]),
  isDemo: z.boolean().optional(),
});

export type About = z.infer<typeof AboutSchema>;
export { AboutSchema };
