import { describe, expect, it, vi } from 'vitest';
import { openLockSession } from './openLockSession';

/**
 * A pool of one connection that answers each lock query as Postgres would, holding what it is told.
 *
 * @param isFree - Whether the lock asked for is free.
 * @returns The pool, and what it was asked.
 */
const aPool = (isFree: boolean) => {
  const asked: { text: string; values: (string | number)[] }[] = [];
  const listeners: (() => void)[] = [];

  return {
    asked,
    listeners,
    pool: {
      connect: () =>
        Promise.resolve({
          query: (text: string, values: (string | number)[]) => {
            asked.push({ text, values });

            return Promise.resolve({ rows: [{ locked: isFree }] });
          },
          on: (_event: 'error', listener: () => void) => {
            listeners.push(listener);
          },
        }),
    },
  };
};

describe('openLockSession', () => {
  it('takes a library by an advisory lock that does not wait', async () => {
    const { asked, pool } = aPool(true);
    const session = await openLockSession(pool);

    await expect(session.take('reading:one')).resolves.toBe(true);
    expect(asked[0]?.text).toContain('pg_try_advisory_lock');
    expect(asked[0]?.values[1]).toBe('reading:one');
  });

  it('says so where another session holds it', async () => {
    const { pool } = aPool(false);
    const session = await openLockSession(pool);

    await expect(session.take('reading:one')).resolves.toBe(false);
  });

  it('gives the lock up on the same connection it was taken on', async () => {
    const { asked, pool } = aPool(true);
    const session = await openLockSession(pool);

    await session.release('reading:one');

    expect(asked[0]?.text).toContain('pg_advisory_unlock');
  });

  it('hears when the connection breaks', async () => {
    const { listeners, pool } = aPool(true);
    const session = await openLockSession(pool);
    const broke = vi.fn();

    session.on('error', broke);
    listeners.forEach((listener) => {
      listener();
    });

    expect(broke).toHaveBeenCalledOnce();
  });
});
