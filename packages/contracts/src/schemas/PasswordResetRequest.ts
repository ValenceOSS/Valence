import { z } from 'zod';

const REDIRECT = z.string().min(1).max(2048);

const PasswordResetRequestSchema = z.union([
  z.object({
    identifier: z.string().trim().min(1).max(320),
    redirectTo: REDIRECT,
  }),
  z.object({
    profileId: z.string().uuid(),
    redirectTo: REDIRECT,
  }),
]);

const PasswordResetRequestedSchema = z.object({
  requested: z.literal(true),
});

type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
type PasswordResetAsk = { identifier: string } | { profileId: string };
type PasswordResetRequested = z.infer<typeof PasswordResetRequestedSchema>;

export type { PasswordResetAsk, PasswordResetRequest, PasswordResetRequested };

export { PasswordResetRequestedSchema, PasswordResetRequestSchema };
