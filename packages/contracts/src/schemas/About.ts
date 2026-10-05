import { z } from 'zod';
import { ClientKindSchema } from './ClientKind';

const AboutSchema = z.object({
  version: z.string().optional(),
  commit: z.string(),
  features: z.array(z.string()).default([]),
  isDemo: z.boolean().optional(),
  closedApps: z.array(ClientKindSchema).optional(),
});

export type About = z.infer<typeof AboutSchema>;
export { AboutSchema };
