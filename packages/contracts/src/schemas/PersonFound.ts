import { z } from 'zod';

const PersonFoundSchema = z.object({
  personId: z.number().int().positive(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  titleCount: z.number().int().nonnegative(),
});

type PersonFound = z.infer<typeof PersonFoundSchema>;

export type { PersonFound };

export { PersonFoundSchema };
