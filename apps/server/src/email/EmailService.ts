import type { Said } from '@ValenceI18n/SaidSchema';
import type { EmailSetup, EmailSetupChange } from '@ValenceContracts/schemas/EmailSetup';

type EmailPurpose = 'passwordResets' | 'setupLinks';

type EmailOutcome = { kind: 'sent' } | { kind: 'off' } | { kind: 'failed'; problem: Said };

type LinkEmail = {
  to: string;
  name: string;
  url: string;
  expiresAt: Date;
  idempotencyKey: string;
};

type EmailService = {
  isOn: (purpose: EmailPurpose) => Promise<boolean>;
  sendSetupLink: (email: LinkEmail) => Promise<EmailOutcome>;
  sendPasswordReset: (email: LinkEmail) => Promise<EmailOutcome>;
  sendTest: (to: string) => Promise<EmailOutcome>;
  setup: () => Promise<EmailSetup>;
  change: (change: EmailSetupChange) => Promise<EmailSetup>;
};

export type { EmailOutcome, EmailPurpose, EmailService, LinkEmail };
