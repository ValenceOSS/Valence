import { describe, expect, it, vi } from 'vitest';
import { handOverResetLink } from './handOverResetLink';

const LINK = 'https://valence.local/api/auth/reset-password/Zm9vYmFyYmF6cXV4MTIz?callbackURL=/';

const handOver = (outcome: Parameters<typeof handOverResetLink>[0]['outcome']) => {
  const log = { info: vi.fn() };
  const toConsole = vi.fn();

  handOverResetLink({ email: 'sam@example.com', url: LINK, outcome }, { log, toConsole });

  return { log, toConsole };
};

describe('handOverResetLink', () => {
  it('never writes the link where the admin area can read it', () => {
    const { log } = handOver({ kind: 'off' });

    expect(log.info).toHaveBeenCalledOnce();
    expect(JSON.stringify(log.info.mock.calls)).not.toContain('Zm9vYmFyYmF6cXV4MTIz');
  });

  it('gives the link to whoever runs the server when email is off', () => {
    const { toConsole } = handOver({ kind: 'off' });

    expect(toConsole).toHaveBeenCalledWith(expect.stringContaining(LINK));
  });

  it('gives the link to whoever runs the server when the email could not be sent', () => {
    const { toConsole } = handOver({
      kind: 'failed',
      problem: { code: null, message: 'refused', values: {} },
    });

    expect(toConsole).toHaveBeenCalledWith(expect.stringContaining(LINK));
  });

  it('keeps the link off the console once it has been emailed', () => {
    const { toConsole } = handOver({ kind: 'sent' });

    expect(toConsole).not.toHaveBeenCalled();
  });
});
