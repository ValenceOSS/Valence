import { z } from 'zod';

const PasswordResetRequestSchema = z.object({
  identifier: z.string().trim().min(1).max(320),
  redirectTo: z.string().min(1).max(2048),
});

const PasswordResetRequestedSchema = z.object({
  requested: z.literal(true),
});

type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
type PasswordResetRequested = z.infer<typeof PasswordResetRequestedSchema>;

export type { PasswordResetRequest, PasswordResetRequested };

export { PasswordResetRequestedSchema, PasswordResetRequestSchema };
