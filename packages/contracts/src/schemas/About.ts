import { z } from 'zod';

const AboutSchema = z.object({
  commit: z.string(),
});

export type About = z.infer<typeof AboutSchema>;
export { AboutSchema };
