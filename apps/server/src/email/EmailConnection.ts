import type { EmailSecurity } from '@ValenceContracts/schemas/EmailSettings';

type SmtpServer = {
  host: string;
  port: number;
  security: EmailSecurity;
  username: string;
  password: string;
};

type EmailConnection = SmtpServer & {
  fromName: string;
  fromAddress: string;
};

type EmailEnvironment = {
  smtpUrl: string;
  smtpFrom: string;
};

export type { EmailConnection, EmailEnvironment, SmtpServer };
