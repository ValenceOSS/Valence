import { EMAIL_DEFAULTS } from '@ValenceContracts/schemas/EmailSettings';
import type { EmailSetup } from '@ValenceContracts/schemas/EmailSetup';
import type { EmailService } from './EmailService';

const UNSET: EmailSetup = {
  isEnabled: false,
  host: EMAIL_DEFAULTS.host,
  port: EMAIL_DEFAULTS.port,
  security: EMAIL_DEFAULTS.security,
  username: EMAIL_DEFAULTS.username,
  hasPassword: false,
  fromName: EMAIL_DEFAULTS.fromName,
  fromAddress: EMAIL_DEFAULTS.fromAddress,
  sendsPasswordResets: false,
  sendsSetupLinks: false,
  isFromEnvironment: false,
  recent: [],
};

const NO_EMAIL: EmailService = {
  isOn: () => Promise.resolve(false),
  sendSetupLink: () => Promise.resolve({ kind: 'off' }),
  sendPasswordReset: () => Promise.resolve({ kind: 'off' }),
  sendTest: () => Promise.resolve({ kind: 'off' }),
  setup: () => Promise.resolve(UNSET),
  change: () => Promise.resolve(UNSET),
};

export { NO_EMAIL };
