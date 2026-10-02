import { z } from 'zod';

const TermsSchema = z
  .union([z.array(z.string()), z.string()])
  .nullish()
  .transform((terms) =>
    (typeof terms === 'string' ? terms.split(',') : (terms ?? []))
      .map((term) => term.trim())
      .filter((term) => term !== ''),
  );

const ArrReleaseProfileSchema = z.object({
  id: z.number().int(),
  name: z.string().nullish(),
  enabled: z.boolean().default(true),
  required: TermsSchema,
  ignored: TermsSchema,
  preferred: z
    .array(z.object({ key: z.string(), value: z.number().int() }))
    .nullish()
    .transform((preferred) => preferred ?? []),
  tags: z.array(z.number().int()).default([]),
});

type ArrReleaseProfile = z.infer<typeof ArrReleaseProfileSchema>;

export type { ArrReleaseProfile };

export { ArrReleaseProfileSchema };
