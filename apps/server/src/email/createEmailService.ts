import { createHash, randomUUID } from 'node:crypto';
import { saying } from '@ValenceI18n/saying';
import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';
import { composeLinkEmail } from './composeLinkEmail';
import { composeTestEmail } from './composeTestEmail';
import { applyEmailChange } from './applyEmailChange';
import { describeEmailSetup } from './describeEmailSetup';
import { createSendLimiter } from './createSendLimiter';
import { describeSendFailure } from './describeSendFailure';
import { openSmtpTransport } from './openSmtpTransport';
import { readEmailConnection } from './readEmailConnection';
import { renderEmail } from './renderEmail';
import type { EmailKind } from '@ValenceContracts/schemas/EmailSend';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { Logger } from '@ValenceServer/logging/Logger';
import type { EmailConnection, EmailEnvironment, SmtpServer } from './EmailConnection';
import type { EmailContent } from './EmailContent';
import type { EmailSendStore } from './EmailSendStore';
import type { EmailOutcome, EmailService, LinkEmail } from './EmailService';
import type { MailTransport } from './MailTransport';

const SENDS_PER_SECOND = 10;

const RECENT_SENDS = 20;

type CreateEmailServiceOptions = {
  settings: SettingsStore;
  sends: EmailSendStore;
  environment: EmailEnvironment;
  log: Pick<Logger, 'info' | 'warn'>;
  openTransport?: (server: SmtpServer) => MailTransport;
  waitTurn?: () => Promise<void>;
  timeZone?: string;
};

/**
 * Sends Valence's email through the operator's own SMTP server: setup links, password resets and
 * the test from Settings, and keeps what Settings shows of it. Each email is sent once per idempotency key, at most ten a second, and
 * every attempt is recorded, a failure with its reason, for the administrator to see.
 *
 * @param options - The settings, where sends are recorded, the environment's alternative, the
 *   logger, and for tests how a transport is opened and how a send waits its turn.
 * @returns The email service.
 */
const createEmailService = ({
  settings,
  sends,
  environment,
  log,
  openTransport = openSmtpTransport,
  waitTurn = createSendLimiter(SENDS_PER_SECOND),
  timeZone,
}: CreateEmailServiceOptions): EmailService => {
  const isFromEnvironment = environment.smtpUrl.trim() !== '';
  const inFlight = new Map<string, Promise<EmailOutcome>>();
  let open: { key: string; transport: MailTransport } | null = null;

  const transportFor = (connection: EmailConnection): MailTransport => {
    const { host, port, security, username, password } = connection;
    const key = JSON.stringify([host, port, security, username, password]);

    if (open?.key === key) {
      return open.transport;
    }

    open?.transport.close();
    open = { key, transport: openTransport({ host, port, security, username, password }) };

    return open.transport;
  };

  const readConnection = async (): Promise<{
    isEnabled: boolean;
    sendsPasswordResets: boolean;
    sendsSetupLinks: boolean;
    connection: EmailConnection | null;
  }> => {
    const { email } = await settings.read();

    return {
      isEnabled: isFromEnvironment || email.isEnabled,
      sendsPasswordResets: email.sendsPasswordResets,
      sendsSetupLinks: email.sendsSetupLinks,
      connection: readEmailConnection(email, environment),
    };
  };

  const deliver = async (
    kind: EmailKind,
    to: string,
    idempotencyKey: string,
    connection: EmailConnection,
    content: (server: string) => EmailContent,
  ): Promise<EmailOutcome> => {
    if (await sends.wasSent(idempotencyKey)) {
      return { kind: 'sent' };
    }

    const server = connection.fromName === '' ? connection.host : connection.fromName;
    const { subject, text, html } = renderEmail(content(server), server);
    const messageId = `<${createHash('sha256').update(idempotencyKey).digest('hex')}@${connection.fromAddress.split('@')[1] ?? connection.host}>`;

    try {
      await waitTurn();
      await transportFor(connection).send({
        from: { name: connection.fromName, address: connection.fromAddress },
        to,
        subject,
        text,
        html,
        messageId,
      });
    } catch (error) {
      const problem = describeSendFailure(
        error instanceof Error ? error : new Error(String(error)),
        connection.host,
      );

      log.warn('server', `email ${kind} to ${to} failed: ${problem.message}`);
      await sends.record({ kind, recipient: to, idempotencyKey, failure: problem });

      return { kind: 'failed', problem };
    }

    log.info('server', `email ${kind} sent to ${to}`);
    await sends.record({ kind, recipient: to, idempotencyKey, failure: null });

    return { kind: 'sent' };
  };

  const once = (idempotencyKey: string, send: () => Promise<EmailOutcome>) => {
    const already = inFlight.get(idempotencyKey);

    if (already !== undefined) {
      return already;
    }

    const sending = send().finally(() => {
      inFlight.delete(idempotencyKey);
    });

    inFlight.set(idempotencyKey, sending);

    return sending;
  };

  const sendLink = (
    kind: 'setupLink' | 'passwordReset',
    { to, name, url, expiresAt, idempotencyKey }: LinkEmail,
  ): Promise<EmailOutcome> =>
    once(idempotencyKey, async () => {
      const state = await readConnection();
      const isWanted = kind === 'setupLink' ? state.sendsSetupLinks : state.sendsPasswordResets;

      if (
        !state.isEnabled ||
        !isWanted ||
        state.connection === null ||
        to.toLowerCase().endsWith(`@${NO_EMAIL_DOMAIN}`)
      ) {
        return { kind: 'off' };
      }

      return deliver(kind, to, idempotencyKey, state.connection, (server) =>
        composeLinkEmail(kind, { name, url, expiresAt, server }, timeZone),
      );
    });

  return {
    isOn: async (purpose) => {
      const state = await readConnection();
      const isWanted = purpose === 'setupLinks' ? state.sendsSetupLinks : state.sendsPasswordResets;

      return state.isEnabled && isWanted && state.connection !== null;
    },

    sendSetupLink: (email) => sendLink('setupLink', email),

    sendPasswordReset: (email) => sendLink('passwordReset', email),

    sendTest: async (to) => {
      const { connection } = await readConnection();

      if (connection === null) {
        return {
          kind: 'failed',
          problem: saying('server.email.createEmailService.thereIsNoMailServer'),
        };
      }

      return deliver('test', to, `test:${randomUUID()}`, connection, composeTestEmail);
    },

    setup: async () =>
      describeEmailSetup(
        (await settings.read()).email,
        environment,
        await sends.recent(RECENT_SENDS),
      ),

    change: async (change) => {
      const { email } = await settings.write({
        email: applyEmailChange((await settings.read()).email, change),
      });

      return describeEmailSetup(email, environment, await sends.recent(RECENT_SENDS));
    },
  };
};

export type { CreateEmailServiceOptions };

export { createEmailService };
