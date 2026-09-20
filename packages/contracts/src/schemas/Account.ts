import { z } from 'zod';
import { HouseholdSchema } from './Household';
import { ViewerProfileSchema } from './ViewerProfile';

const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
  isBanned: z.boolean(),
  banReason: z.string().nullable(),
  position: z.number().nullable(),
  isAdministrator: z.boolean(),
  face: HouseholdSchema.nullable(),
  profile: ViewerProfileSchema.nullish(),
  roles: z.array(z.string()),
});

const AccountListSchema = z.object({ accounts: z.array(AccountSchema) });

type Account = z.infer<typeof AccountSchema>;

export type { Account };

export { AccountListSchema, AccountSchema };
