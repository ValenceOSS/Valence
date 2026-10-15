import { z } from 'zod';

const ChildAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  hasPin: z.boolean(),
});

const ChildAccountListSchema = z.object({ children: z.array(ChildAccountSchema) });

const CHILD_PIN = /^\d{4,8}$/u;

type ChildAccount = z.infer<typeof ChildAccountSchema>;

export type { ChildAccount };

export { CHILD_PIN, ChildAccountListSchema, ChildAccountSchema };
