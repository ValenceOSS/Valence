import { z } from 'zod';

const PasskeyAttestationSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: z.string().min(1),
    attestationObject: z.string().min(1),
    transports: z.array(z.string()),
  }),
});

type PasskeyAttestation = z.infer<typeof PasskeyAttestationSchema>;

export type { PasskeyAttestation };

export { PasskeyAttestationSchema };
