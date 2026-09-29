import { z } from 'zod';

const PasskeyRequestOptionsSchema = z.object({
  challenge: z.string().min(1),
  rpId: z.string().min(1).optional(),
  timeout: z.number().int().positive().optional(),
  allowCredentials: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.literal('public-key'),
        transports: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  userVerification: z.enum(['required', 'preferred', 'discouraged']).optional(),
});

type PasskeyRequestOptions = z.infer<typeof PasskeyRequestOptionsSchema>;

export type { PasskeyRequestOptions };

export { PasskeyRequestOptionsSchema };
