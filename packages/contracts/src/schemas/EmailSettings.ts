import { z } from 'zod';

const EMAIL_SECURITIES = ['tls', 'starttls', 'none'] as const;

const EmailSecuritySchema = z.enum(EMAIL_SECURITIES);

const EmailSettingsSchema = z.object({
  isEnabled: z.boolean().default(false),
  host: z.string().default(''),
  port: z.number().int().min(1).max(65_535).default(587),
  security: EmailSecuritySchema.default('starttls'),
  username: z.string().default(''),
  password: z.string().default(''),
  fromName: z.string().default(''),
  fromAddress: z.string().default(''),
  sendsPasswordResets: z.boolean().default(false),
  sendsSetupLinks: z.boolean().default(false),
});

const EMAIL_DEFAULTS = EmailSettingsSchema.parse({});

type EmailSecurity = z.infer<typeof EmailSecuritySchema>;
type EmailSettings = z.infer<typeof EmailSettingsSchema>;

export type { EmailSecurity, EmailSettings };

export { EMAIL_DEFAULTS, EMAIL_SECURITIES, EmailSecuritySchema, EmailSettingsSchema };
