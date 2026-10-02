import { z } from 'zod';
import { HouseholdSchema } from './Household';
import { SetupStateSchema } from './SetupLink';
import { ViewerProfileSchema } from './ViewerProfile';

const AccountSetupSchema = z.object({
  state: SetupStateSchema,
  expiresAt: z.string().nullable(),
});

const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable().default(null),
  email: z.string().nullable(),
  createdAt: z.string(),
  isBanned: z.boolean(),
  banReason: z.string().nullable(),
  position: z.number().nullable(),
  isAdministrator: z.boolean(),
  face: HouseholdSchema.nullable(),
  profile: ViewerProfileSchema.nullish(),
  roles: z.array(z.string()),
  canSignIn: z.boolean().default(true),
  lastSignedInAt: z.string().nullable().default(null),
  setup: AccountSetupSchema.default({ state: 'none', expiresAt: null }),
});

const AccountListSchema = z.object({
  accounts: z.array(AccountSchema),
  canEmailSetupLinks: z.boolean().default(false),
});

type Account = z.infer<typeof AccountSchema>;
type AccountSetup = z.infer<typeof AccountSetupSchema>;

export type { Account, AccountSetup };

export { AccountListSchema, AccountSchema, AccountSetupSchema };
