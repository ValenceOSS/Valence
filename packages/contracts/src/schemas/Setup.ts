import { z } from 'zod';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { UsernameSchema } from '@ValenceContracts/schemas/SetupLink';

const SetupStatusSchema = z.object({
  isComplete: z.boolean(),
  isFlowOpen: z.boolean().default(false),
  detectedOrigin: z.string(),
  isSecureContext: z.boolean(),
  suggestedTrustedOrigins: z.array(z.string()),
});

const SetupAdminSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: UsernameSchema,
  email: z.string().trim().email().optional(),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(200),
});

const SetupRequestSchema = z.object({
  admin: SetupAdminSchema,
  trustedOrigins: z.array(z.string().url()).min(1),
  cookieSecure: z.boolean(),
});

const SetupResultSchema = z.object({
  isComplete: z.literal(true),
  isSignedIn: z.boolean().default(false),
  restartRequired: z.boolean(),
});

const SetupFlowFinishedSchema = z.object({ isFlowOpen: z.literal(false) });

const SetupErrorSchema = z.object({ error: z.string() });

export type SetupStatus = z.infer<typeof SetupStatusSchema>;
export type SetupRequest = z.infer<typeof SetupRequestSchema>;
export type SetupResult = z.infer<typeof SetupResultSchema>;
export {
  SetupStatusSchema,
  SetupAdminSchema,
  SetupRequestSchema,
  SetupResultSchema,
  SetupFlowFinishedSchema,
  SetupErrorSchema,
};
