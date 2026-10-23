import { describe, expect, it, vi } from 'vitest';
import { handOverResetLink } from './handOverResetLink';
import type { EmailOutcome } from './EmailService';

const LINK = 'https://valence.local/api/auth/reset-password/Zm9vYmFyYmF6cXV4MTIz?callbackURL=/';

const handOver = async (send: () => Promise<EmailOutcome>) => {
  const log = { info: vi.fn(), warn: vi.fn() };
  const toConsole = vi.fn();

  await handOverResetLink({ email: 'sam@example.com', url: LINK, send }, { log, toConsole });

  return { log, toConsole };
};

describe('handOverResetLink', () => {
  it('never writes the link where the admin area can read it', async () => {
    const { log } = await handOver(() => Promise.reject(new Error('the database went away')));

    expect(log.info).toHaveBeenCalledOnce();
    expect(JSON.stringify([log.info.mock.calls, log.warn.mock.calls])).not.toContain(
      'Zm9vYmFyYmF6cXV4MTIz',
    );
  });

  it('gives the link to whoever runs the server when email is off', async () => {
    const { toConsole } = await handOver(() => Promise.resolve({ kind: 'off' }));

    expect(toConsole).toHaveBeenCalledWith(expect.stringContaining(LINK));
  });

  it('gives the link to whoever runs the server when the email could not be sent', async () => {
    const { toConsole } = await handOver(() =>
      Promise.resolve({ kind: 'failed', problem: { code: null, message: 'refused', values: {} } }),
    );

    expect(toConsole).toHaveBeenCalledWith(expect.stringContaining(LINK));
  });

  it('still gives the link, and says why, when sending it throws', async () => {
    const { log, toConsole } = await handOver(() =>
      Promise.reject(new Error('the database went away')),
    );

    expect(toConsole).toHaveBeenCalledWith(expect.stringContaining(LINK));
    expect(log.warn).toHaveBeenCalledWith(
      'auth',
      expect.stringContaining('the database went away'),
    );
  });

  it('keeps the link off the console once it has been emailed', async () => {
    const { toConsole } = await handOver(() => Promise.resolve({ kind: 'sent' }));

    expect(toConsole).not.toHaveBeenCalled();
  });
});
