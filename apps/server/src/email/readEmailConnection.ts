import { parseSmtpFrom } from './parseSmtpFrom';
import { parseSmtpUrl } from './parseSmtpUrl';
import type { EmailSettings } from '@ValenceContracts/schemas/EmailSettings';
import type { EmailConnection, EmailEnvironment } from './EmailConnection';

/**
 * The mail server and sender email goes out through: the environment's `SMTP_URL` and `SMTP_FROM`
 * when they are set, otherwise what was saved in settings.
 *
 * @param settings - The email settings saved on the server.
 * @param environment - The environment's alternative.
 * @returns The connection, or `null` when there is no mail server or no sender to send as.
 */
const readEmailConnection = (
  settings: EmailSettings,
  environment: EmailEnvironment,
): EmailConnection | null => {
  if (environment.smtpUrl.trim() !== '') {
    const server = parseSmtpUrl(environment.smtpUrl);
    const from = parseSmtpFrom(environment.smtpFrom);

    if (server === null || from.address === '') {
      return null;
    }

    return { ...server, fromName: from.name, fromAddress: from.address };
  }

  if (settings.host.trim() === '' || settings.fromAddress.trim() === '') {
    return null;
  }

  return {
    host: settings.host.trim(),
    port: settings.port,
    security: settings.security,
    username: settings.username,
    password: settings.password,
    fromName: settings.fromName.trim(),
    fromAddress: settings.fromAddress.trim(),
  };
};

export { readEmailConnection };
