import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { EmailSecuritySchema } from './EmailSettings';
import { EmailSendSchema } from './EmailSend';

const EmailSetupSchema = z.object({
  isEnabled: z.boolean(),
  host: z.string(),
  port: z.number().int(),
  security: EmailSecuritySchema,
  username: z.string(),
  hasPassword: z.boolean(),
  fromName: z.string(),
  fromAddress: z.string(),
  sendsPasswordResets: z.boolean(),
  sendsSetupLinks: z.boolean(),
  isFromEnvironment: z.boolean(),
  recent: z.array(EmailSendSchema),
});

const EmailSetupChangeSchema = z.object({
  isEnabled: z.boolean(),
  host: z.string().trim().max(255),
  port: z.number().int().min(1).max(65_535),
  security: EmailSecuritySchema,
  username: z.string().max(255),
  password: z.string().max(1024).default(''),
  fromName: z.string().trim().max(200),
  fromAddress: z.union([z.literal(''), z.string().trim().email().max(320)]),
  sendsPasswordResets: z.boolean(),
  sendsSetupLinks: z.boolean(),
});

const EmailTestRequestSchema = z.object({
  to: z.string().trim().email().max(320),
});

const EmailTestResultSchema = z.object({
  sent: z.boolean(),
  problem: SaidSchema.nullable(),
});

type EmailSetup = z.infer<typeof EmailSetupSchema>;
type EmailSetupChange = z.input<typeof EmailSetupChangeSchema>;
type EmailTestRequest = z.infer<typeof EmailTestRequestSchema>;
type EmailTestResult = z.infer<typeof EmailTestResultSchema>;

export type { EmailSetup, EmailSetupChange, EmailTestRequest, EmailTestResult };

export { EmailSetupChangeSchema, EmailSetupSchema, EmailTestRequestSchema, EmailTestResultSchema };
