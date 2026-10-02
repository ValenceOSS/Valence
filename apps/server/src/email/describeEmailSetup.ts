import { readEmailConnection } from './readEmailConnection';
import type { EmailSettings } from '@ValenceContracts/schemas/EmailSettings';
import type { EmailSend } from '@ValenceContracts/schemas/EmailSend';
import type { EmailSetup } from '@ValenceContracts/schemas/EmailSetup';
import type { EmailEnvironment } from './EmailConnection';

/**
 * What a browser is told about email: the mail server and sender in use, whether a password is set
 * but never the password, whether the environment decides the server, and the latest sends.
 *
 * @param settings - The email settings saved on the server.
 * @param environment - The environment's alternative.
 * @param recent - The latest emails tried.
 * @returns The setup as Settings shows it.
 */
const describeEmailSetup = (
  settings: EmailSettings,
  environment: EmailEnvironment,
  recent: EmailSend[],
): EmailSetup => {
  const isFromEnvironment = environment.smtpUrl.trim() !== '';
  const fromEnvironment = isFromEnvironment ? readEmailConnection(settings, environment) : null;
  const shown = fromEnvironment ?? settings;

  return {
    isEnabled: isFromEnvironment || settings.isEnabled,
    host: shown.host,
    port: shown.port,
    security: shown.security,
    username: shown.username,
    hasPassword: shown.password !== '',
    fromName: shown.fromName,
    fromAddress: shown.fromAddress,
    sendsPasswordResets: settings.sendsPasswordResets,
    sendsSetupLinks: settings.sendsSetupLinks,
    isFromEnvironment,
    recent,
  };
};

export { describeEmailSetup };
