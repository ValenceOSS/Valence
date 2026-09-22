import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GOODBYE_WITHIN_MS, stopAnnouncingOnExit } from './stopAnnouncingOnExit';
import type { Leaving } from './stopAnnouncingOnExit';

/**
 * A process that can be sent a signal, and remembers the one it raised again on the way out.
 *
 * @returns The process, a way to signal it, and what it raised.
 */
const aProcess = () => {
  const listeners = new Map<string, () => void>();
  const raised: string[] = [];

  const leaving: Leaving = {
    pid: 42,
    once: (signal, listener) => {
      listeners.set(signal, listener);
    },
    kill: (_pid, signal) => {
      raised.push(signal);
    },
  };

  return {
    leaving,
    raised,
    send: (signal: string) => {
      listeners.get(signal)?.();
    },
  };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('stopAnnouncingOnExit', () => {
  it('says goodbye before leaving, then leaves on the same signal it was sent', () => {
    const { leaving, raised, send } = aProcess();
    const stop = vi.fn((done: () => void) => {
      done();
    });

    stopAnnouncingOnExit(stop, leaving);
    send('SIGTERM');

    expect(stop).toHaveBeenCalledOnce();
    expect(raised).toEqual(['SIGTERM']);
  });

  it('leaves the same way for an interrupt as for a termination', () => {
    const { leaving, raised, send } = aProcess();

    stopAnnouncingOnExit((done) => {
      done();
    }, leaving);
    send('SIGINT');

    expect(raised).toEqual(['SIGINT']);
  });

  it('does not wait long for a goodbye that never finishes', () => {
    const { leaving, raised, send } = aProcess();

    stopAnnouncingOnExit(() => undefined, leaving);
    send('SIGTERM');

    expect(raised).toEqual([]);

    vi.advanceTimersByTime(GOODBYE_WITHIN_MS);

    expect(raised).toEqual(['SIGTERM']);
  });

  it('leaves only once when a goodbye finishes after it was given up on', () => {
    const { leaving, raised, send } = aProcess();
    let finish: () => void = () => undefined;

    stopAnnouncingOnExit((done) => {
      finish = done;
    }, leaving);
    send('SIGTERM');
    vi.advanceTimersByTime(GOODBYE_WITHIN_MS);
    finish();

    expect(raised).toEqual(['SIGTERM']);
  });
});
