import { z } from 'zod';

const ArrStatusSchema = z.object({
  appName: z.string().optional(),
  instanceName: z.string().optional(),
  version: z.string(),
});

export { ArrStatusSchema };
