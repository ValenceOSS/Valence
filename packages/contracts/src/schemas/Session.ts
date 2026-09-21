import { z } from 'zod';

const SessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  role: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
});

const GetSessionResponseSchema = z
  .object({
    user: SessionUserSchema,
  })
  .nullable();

const SignInResponseSchema = z.union([
  z.object({
    twoFactorRedirect: z.literal(true),
    twoFactorMethods: z.array(z.string()).optional(),
  }),
  z.object({
    redirect: z.boolean().optional(),
    token: z.string().optional(),
    user: SessionUserSchema,
  }),
]);

export type SessionUser = z.infer<typeof SessionUserSchema>;
export { SessionUserSchema, GetSessionResponseSchema, SignInResponseSchema };
