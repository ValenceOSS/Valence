import { z } from 'zod';

const RefuseFormSchema = z.object({
  reason: z.string().trim(),
});

export { RefuseFormSchema };
