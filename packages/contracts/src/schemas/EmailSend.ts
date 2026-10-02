import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';

const EMAIL_KINDS = ['setupLink', 'passwordReset', 'test'] as const;

const EMAIL_SEND_STATES = ['sent', 'failed'] as const;

const EmailKindSchema = z.enum(EMAIL_KINDS);

const EmailSendStateSchema = z.enum(EMAIL_SEND_STATES);

const EmailSendSchema = z.object({
  id: z.string(),
  kind: EmailKindSchema,
  recipient: z.string(),
  state: EmailSendStateSchema,
  failure: SaidSchema.nullable(),
  createdAt: z.string(),
});

type EmailKind = z.infer<typeof EmailKindSchema>;
type EmailSendState = z.infer<typeof EmailSendStateSchema>;
type EmailSend = z.infer<typeof EmailSendSchema>;

export type { EmailKind, EmailSend, EmailSendState };

export { EMAIL_KINDS, EMAIL_SEND_STATES, EmailKindSchema, EmailSendSchema, EmailSendStateSchema };
