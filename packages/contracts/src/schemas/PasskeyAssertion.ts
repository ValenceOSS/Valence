import { z } from 'zod';

const PasskeyAssertionSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: z.string().min(1),
    authenticatorData: z.string().min(1),
    signature: z.string().min(1),
    userHandle: z.string().min(1).optional(),
  }),
});

type PasskeyAssertion = z.infer<typeof PasskeyAssertionSchema>;

export type { PasskeyAssertion };

export { PasskeyAssertionSchema };
