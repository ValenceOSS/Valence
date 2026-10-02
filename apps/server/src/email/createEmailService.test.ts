import { describe, expect, it, vi } from 'vitest';
import { EMAIL_DEFAULTS } from '@ValenceContracts/schemas/EmailSettings';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createEmailService } from './createEmailService';
import { createMemoryEmailSendStore } from './createMemoryEmailSendStore';
import type { EmailSettings } from '@ValenceContracts/schemas/EmailSettings';
import type { EmailEnvironment, SmtpServer } from './EmailConnection';
import type { MailMessage } from './MailTransport';

const ON: EmailSettings = {
  ...EMAIL_DEFAULTS,
  isEnabled: true,
  host: 'smtp.example.com',
  port: 587,
  security: 'starttls',
  username: 'me',
  password: 'secret',
  fromName: 'Home',
  fromAddress: 'valence@example.com',
  sendsPasswordResets: true,
  sendsSetupLinks: true,
};

const LINK = {
  to: 'ada@example.com',
  name: 'Ada',
  url: 'https://valence.example/setup/abc',
  expiresAt: new Date('2026-10-09T14:05:00Z'),
  idempotencyKey: 'setupLink:u1:1',
};

/**
 * An email service over memory, with a transport that records what it is asked to send.
 *
 * @param email - The email settings saved.
 * @param options - The environment, and what each send does.
 * @returns The service, the sends it records, and what reached the transport.
 */
const anEmailService = (
  email: EmailSettings,
  {
    environment = { smtpUrl: '', smtpFrom: '' },
    send = () => Promise.resolve(),
  }: { environment?: EmailEnvironment; send?: (message: MailMessage) => Promise<void> } = {},
) => {
  const settings = createMemorySettingsStore(
    ServerSettingsSchema.parse({
      trustedOrigins: [],
      cookieSecure: false,
      setupCompletedAt: null,
      email,
    }),
  );
  const sends = createMemoryEmailSendStore();
  const delivered: MailMessage[] = [];
  const opened: SmtpServer[] = [];
  const closed = vi.fn();
  const log = { info: vi.fn(), warn: vi.fn() };

  const service = createEmailService({
    settings,
    sends,
    environment,
    log,
    timeZone: 'UTC',
    waitTurn: () => Promise.resolve(),
    openTransport: (server) => {
      opened.push(server);

      return {
        send: async (message) => {
          await send(message);
          delivered.push(message);
        },
        close: closed,
      };
    },
  });

  return { service, settings, sends, delivered, opened, closed, log };
};

describe('createEmailService', () => {
  it('sends a setup link in text and HTML, from the sender set up, and records it', async () => {
    const { service, delivered, sends } = anEmailService(ON);

    expect(await service.sendSetupLink(LINK)).toEqual({ kind: 'sent' });
    expect(delivered).toHaveLength(1);
    expect(delivered[0]).toMatchObject({
      from: { name: 'Home', address: 'valence@example.com' },
      to: 'ada@example.com',
      subject: 'Your account on Home',
    });
    expect(delivered[0]?.text).toContain(LINK.url);
    expect(delivered[0]?.text).toContain('9 October 2026 at 14:05 UTC');
    expect(delivered[0]?.html).toContain(LINK.url);
    expect(delivered[0]?.messageId).toMatch(/^<[0-9a-f]{64}@example\.com>$/);
    expect(await sends.recent(5)).toMatchObject([
      { kind: 'setupLink', recipient: 'ada@example.com', state: 'sent', failure: null },
    ]);
  });

  it('never sends one idempotency key twice, even asked at the same moment', async () => {
    const { service, delivered } = anEmailService(ON);

    await Promise.all([service.sendSetupLink(LINK), service.sendSetupLink(LINK)]);
    await service.sendSetupLink(LINK);

    expect(delivered).toHaveLength(1);
  });

  it('records a failure with its reason, logs it, and sends again on a retry', async () => {
    let fails = true;
    const { service, delivered, sends, log } = anEmailService(ON, {
      send: () =>
        fails
          ? Promise.reject(Object.assign(new Error('Invalid login'), { code: 'EAUTH' }))
          : Promise.resolve(),
    });

    expect(await service.sendPasswordReset(LINK)).toMatchObject({
      kind: 'failed',
      problem: {
        message: 'The mail server at smtp.example.com refused the username or password.',
      },
    });
    expect(log.warn).toHaveBeenCalled();
    expect(await sends.recent(5)).toMatchObject([{ state: 'failed', kind: 'passwordReset' }]);

    fails = false;

    expect(await service.sendPasswordReset(LINK)).toEqual({ kind: 'sent' });
    expect(delivered).toHaveLength(1);
    expect(await sends.recent(5)).toMatchObject([{ state: 'sent' }]);
  });

  it('sends nothing while email is off, the kind is switched off, or the address is a placeholder', async () => {
    expect(await anEmailService({ ...ON, isEnabled: false }).service.sendSetupLink(LINK)).toEqual({
      kind: 'off',
    });
    expect(
      await anEmailService({ ...ON, sendsSetupLinks: false }).service.sendSetupLink(LINK),
    ).toEqual({ kind: 'off' });
    expect(
      await anEmailService({ ...ON, sendsPasswordResets: false }).service.sendPasswordReset(LINK),
    ).toEqual({ kind: 'off' });

    const { service, delivered } = anEmailService(ON);

    expect(await service.sendSetupLink({ ...LINK, to: 'u1@no-email.invalid' })).toEqual({
      kind: 'off',
    });
    expect(delivered).toHaveLength(0);
  });

  it('is on for a purpose only when on, wanted for it, and set up', async () => {
    expect(await anEmailService(ON).service.isOn('setupLinks')).toBe(true);
    expect(
      await anEmailService({ ...ON, sendsPasswordResets: false }).service.isOn('passwordResets'),
    ).toBe(false);
    expect(await anEmailService({ ...ON, host: '' }).service.isOn('setupLinks')).toBe(false);
    expect(await anEmailService(EMAIL_DEFAULTS).service.isOn('setupLinks')).toBe(false);
  });

  it('sends a test even before email is turned on, and says when there is no server', async () => {
    const { service, delivered } = anEmailService({ ...ON, isEnabled: false });

    expect(await service.sendTest('ada@example.com')).toEqual({ kind: 'sent' });
    expect(await service.sendTest('ada@example.com')).toEqual({ kind: 'sent' });
    expect(delivered.map((one) => one.subject)).toEqual([
      'Email from Valence works',
      'Email from Valence works',
    ]);
    expect(await anEmailService(EMAIL_DEFAULTS).service.sendTest('a@b.c')).toMatchObject({
      kind: 'failed',
      problem: { code: 'server.email.createEmailService.thereIsNoMailServer' },
    });
  });

  it('keeps one transport until the server changes', async () => {
    const { service, settings, opened, closed } = anEmailService(ON);

    await service.sendTest('a@example.com');
    await service.sendTest('b@example.com');

    expect(opened).toHaveLength(1);

    await settings.write({ email: { ...ON, port: 2525 } });
    await service.sendTest('c@example.com');

    expect(opened).toHaveLength(2);
    expect(opened[1]?.port).toBe(2525);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('sends through the environment server when SMTP_URL is set, even with email off', async () => {
    const { service, opened, delivered } = anEmailService(
      { ...EMAIL_DEFAULTS, sendsSetupLinks: true },
      {
        environment: {
          smtpUrl: 'smtps://resend:re_key@smtp.resend.com:465',
          smtpFrom: 'Home <home@example.org>',
        },
      },
    );

    expect(await service.sendSetupLink(LINK)).toEqual({ kind: 'sent' });
    expect(opened[0]).toEqual({
      host: 'smtp.resend.com',
      port: 465,
      security: 'tls',
      username: 'resend',
      password: 're_key',
    });
    expect(delivered[0]?.from).toEqual({ name: 'Home', address: 'home@example.org' });
  });

  it('shows and saves the setup without ever giving the password back', async () => {
    const { service, settings } = anEmailService(ON);

    expect(await service.setup()).toMatchObject({ host: 'smtp.example.com', hasPassword: true });

    const saved = await service.change({
      isEnabled: true,
      host: 'smtp.resend.com',
      port: 465,
      security: 'tls',
      username: 'resend',
      password: '',
      fromName: 'Home',
      fromAddress: 'valence@example.com',
      sendsPasswordResets: true,
      sendsSetupLinks: false,
    });

    expect(saved).toMatchObject({
      host: 'smtp.resend.com',
      hasPassword: true,
      sendsSetupLinks: false,
    });
    expect(JSON.stringify(saved)).not.toContain('secret');
    expect((await settings.read()).email.password).toBe('secret');
  });
});
