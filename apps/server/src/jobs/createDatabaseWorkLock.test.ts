import { describe, expect, it, vi } from 'vitest';
import { createDatabaseWorkLock } from './createDatabaseWorkLock';
import type { LockSession, LockSessions } from './createDatabaseWorkLock';

type FakeDatabase = {
  sessions: LockSessions;
  opened: () => number;
  breakTheConnection: () => void;
};

const createFakeDatabase = (): FakeDatabase => {
  const heldBy = new Map<string, object>();
  const broken: (() => void)[] = [];

  let opened = 0;

  const connect = (): Promise<LockSession> => {
    const session = {};

    opened += 1;

    return Promise.resolve({
      take: (key: string) => {
        const owner = heldBy.get(key);

        if (owner !== undefined && owner !== session) {
          return Promise.resolve(false);
        }

        heldBy.set(key, session);

        return Promise.resolve(true);
      },
      release: (key: string) => {
        if (heldBy.get(key) === session) {
          heldBy.delete(key);
        }

        return Promise.resolve();
      },
      on: (_event: 'error', listener: () => void) => {
        broken.push(listener);
      },
    });
  };

  return {
    sessions: { connect },
    opened: () => opened,
    breakTheConnection: () => {
      for (const listener of broken.splice(0)) {
        listener();
      }
    },
  };
};

const held = <T>(attempted: { held: false } | { held: true; result: T }): T => {
  if (!attempted.held) {
    throw new Error('the lock was not held');
  }

  return attempted.result;
};

describe('a library lock every process can see', () => {
  it('runs the work and hands back what it made, where the library is nobody else’s', async () => {
    const database = createFakeDatabase();
    const lock = createDatabaseWorkLock({ sessions: database.sessions });

    const attempted = await lock.attempt('reading:one', () => Promise.resolve('scanned'));

    expect(held(attempted)).toBe('scanned');
  });

  it('will not run the work while another process is doing it', async () => {
    const database = createFakeDatabase();
    const first = createDatabaseWorkLock({ sessions: database.sessions });
    const second = createDatabaseWorkLock({ sessions: database.sessions });

    let letTheFirstFinish = (): void => {};

    const running = first.attempt(
      'reading:one',
      () =>
        new Promise<void>((resolve) => {
          letTheFirstFinish = resolve;
        }),
    );

    const other = vi.fn(() => Promise.resolve());

    expect(await second.attempt('reading:one', other)).toEqual({ held: false });
    expect(other).not.toHaveBeenCalled();

    letTheFirstFinish();

    await running;
  });

  it('hands the library on once the process that had it is done', async () => {
    const database = createFakeDatabase();
    const first = createDatabaseWorkLock({ sessions: database.sessions });
    const second = createDatabaseWorkLock({ sessions: database.sessions });

    await first.attempt('reading:one', () => Promise.resolve());

    const after = await second.attempt('reading:one', () => Promise.resolve('mine now'));

    expect(held(after)).toBe('mine now');
  });

  it('lets a different library be worked on at the same time', async () => {
    const database = createFakeDatabase();
    const first = createDatabaseWorkLock({ sessions: database.sessions });
    const second = createDatabaseWorkLock({ sessions: database.sessions });

    let letTheFirstFinish = (): void => {};

    const running = first.attempt(
      'reading:one',
      () =>
        new Promise<void>((resolve) => {
          letTheFirstFinish = resolve;
        }),
    );

    expect(held(await second.attempt('reading:two', () => Promise.resolve('two')))).toBe('two');

    letTheFirstFinish();

    await running;
  });

  it('gives the library up when the work fails, rather than holding it', async () => {
    const database = createFakeDatabase();
    const first = createDatabaseWorkLock({ sessions: database.sessions });
    const second = createDatabaseWorkLock({ sessions: database.sessions });

    await expect(
      first.attempt('reading:one', () => Promise.reject(new Error('the scan broke'))),
    ).rejects.toThrow('the scan broke');

    expect(held(await second.attempt('reading:one', () => Promise.resolve('free')))).toBe('free');
  });

  it('takes every lock on one connection, rather than one for each job', async () => {
    const database = createFakeDatabase();
    const lock = createDatabaseWorkLock({ sessions: database.sessions });

    await lock.attempt('reading:one', () => Promise.resolve());
    await lock.attempt('library.detectSegments:one', () => Promise.resolve());
    await lock.attempt('reading:two', () => Promise.resolve());

    expect(database.opened()).toBe(1);
  });

  it('opens another connection after the one it had broke', async () => {
    const database = createFakeDatabase();
    const lock = createDatabaseWorkLock({ sessions: database.sessions });

    await lock.attempt('reading:one', () => Promise.resolve());

    database.breakTheConnection();

    expect(held(await lock.attempt('reading:one', () => Promise.resolve('again')))).toBe('again');
    expect(database.opened()).toBe(2);
  });
});
