import type { Said } from '@ValenceI18n/SaidSchema';
import type { EmailKind, EmailSend } from '@ValenceContracts/schemas/EmailSend';

type EmailSendRecord = {
  kind: EmailKind;
  recipient: string;
  idempotencyKey: string;
  failure: Said | null;
};

type EmailSendStore = {
  wasSent: (idempotencyKey: string) => Promise<boolean>;
  record: (send: EmailSendRecord) => Promise<void>;
  recent: (limit: number) => Promise<EmailSend[]>;
};

export type { EmailSendRecord, EmailSendStore };
