import { z } from 'zod';

const ParameterSchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/);

const RouteSignInSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('public') }).strict(),
  z.object({ kind: z.literal('bearer') }).strict(),
  z.object({ kind: z.literal('basic') }).strict(),
  z
    .object({
      kind: z.literal('query'),
      login: ParameterSchema.optional(),
      secret: ParameterSchema,
      hexPrefix: z
        .string()
        .regex(/^[a-z]{1,8}:$/)
        .optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('saltedMd5'),
      login: ParameterSchema,
      token: ParameterSchema,
      salt: ParameterSchema,
    })
    .strict(),
]);

type RouteSignIn = z.infer<typeof RouteSignInSchema>;

export type { RouteSignIn };

export { RouteSignInSchema };
