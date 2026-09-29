import { z } from 'zod';

const PasskeyCreationOptionsSchema = z.object({
  challenge: z.string().min(1),
  rp: z.object({ name: z.string(), id: z.string().min(1).optional() }),
  user: z.object({ id: z.string().min(1), name: z.string(), displayName: z.string() }),
  pubKeyCredParams: z.array(z.object({ alg: z.number().int(), type: z.literal('public-key') })),
  timeout: z.number().int().positive().optional(),
  excludeCredentials: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.literal('public-key'),
        transports: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  authenticatorSelection: z
    .object({
      authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
      residentKey: z.enum(['required', 'preferred', 'discouraged']).optional(),
      requireResidentKey: z.boolean().optional(),
      userVerification: z.enum(['required', 'preferred', 'discouraged']).optional(),
    })
    .optional(),
  attestation: z.enum(['none', 'indirect', 'direct', 'enterprise']).optional(),
});

type PasskeyCreationOptions = z.infer<typeof PasskeyCreationOptionsSchema>;

export type { PasskeyCreationOptions };

export { PasskeyCreationOptionsSchema };
