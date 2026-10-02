import { createTransport } from 'nodemailer';
import type { SmtpServer } from './EmailConnection';
import type { MailTransport } from './MailTransport';

const CONNECTION_TIMEOUT_MS = 10_000;

const GREETING_TIMEOUT_MS = 10_000;

const SOCKET_TIMEOUT_MS = 30_000;

/**
 * Opens a nodemailer SMTP transport to a mail server, with timeouts so a server that never answers
 * fails the send rather than holding it forever.
 *
 * @param server - The mail server and how to sign in to it.
 * @returns The transport.
 */
const openSmtpTransport = (server: SmtpServer): MailTransport => {
  const transport = createTransport({
    host: server.host,
    port: server.port,
    secure: server.security === 'tls',
    requireTLS: server.security === 'starttls',
    ignoreTLS: server.security === 'none',
    ...(server.username === '' ? {} : { auth: { user: server.username, pass: server.password } }),
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
  });

  return {
    send: async ({ from, to, subject, text, html, messageId }) => {
      await transport.sendMail({ from, to, subject, text, html, messageId });
    },
    close: () => {
      transport.close();
    },
  };
};

export { openSmtpTransport };
