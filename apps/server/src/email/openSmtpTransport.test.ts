import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openSmtpTransport } from './openSmtpTransport';

const sendMail = vi.fn();
const close = vi.fn();
const createTransport = vi.fn<(options: object) => void>();

vi.mock('nodemailer', () => ({
  createTransport: (options: object) => {
    createTransport(options);

    return { sendMail, close };
  },
}));

const MESSAGE = {
  from: { name: 'Valence', address: 'v@example.com' },
  to: 'ada@example.com',
  subject: 'Hi',
  text: 'Hello',
  html: '<p>Hello</p>',
  messageId: '<abc@example.com>',
};

beforeEach(() => {
  sendMail.mockReset();
  close.mockReset();
  createTransport.mockReset();
});

describe('openSmtpTransport', () => {
  it('connects with TLS from the start, signing in, with timeouts', () => {
    openSmtpTransport({
      host: 'smtp.resend.com',
      port: 465,
      security: 'tls',
      username: 'resend',
      password: 'key',
    });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        requireTLS: false,
        ignoreTLS: false,
        auth: { user: 'resend', pass: 'key' },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 30_000,
      }),
    );
  });

  it('insists on STARTTLS, or sends plainly, and signs in only with a username', () => {
    openSmtpTransport({ host: 'h', port: 587, security: 'starttls', username: '', password: '' });

    expect(createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ secure: false, requireTLS: true, ignoreTLS: false }),
    );
    expect(createTransport.mock.lastCall?.[0]).not.toHaveProperty('auth');

    openSmtpTransport({ host: 'h', port: 25, security: 'none', username: '', password: '' });

    expect(createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ secure: false, requireTLS: false, ignoreTLS: true }),
    );
  });

  it('sends the message as given and closes when asked', async () => {
    sendMail.mockResolvedValue({ messageId: 'x' });

    const transport = openSmtpTransport({
      host: 'h',
      port: 587,
      security: 'starttls',
      username: '',
      password: '',
    });

    await transport.send(MESSAGE);
    transport.close();

    expect(sendMail).toHaveBeenCalledWith(MESSAGE);
    expect(close).toHaveBeenCalled();
  });

  it('lets a failed send throw', async () => {
    sendMail.mockRejectedValue(new Error('refused'));

    const transport = openSmtpTransport({
      host: 'h',
      port: 587,
      security: 'starttls',
      username: '',
      password: '',
    });

    await expect(transport.send(MESSAGE)).rejects.toThrow('refused');
  });
});
