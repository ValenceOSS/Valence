import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gatheredScheduler } from './gatheredScheduler';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('gatheredScheduler', () => {
  it('holds work until the time has passed, then runs it all together in order', () => {
    const schedule = gatheredScheduler(50);
    const ran: string[] = [];

    schedule(() => {
      ran.push('first');
    });
    schedule(() => {
      ran.push('second');
    });

    vi.advanceTimersByTime(49);

    expect(ran).toEqual([]);

    vi.advanceTimersByTime(1);

    expect(ran).toEqual(['first', 'second']);
  });

  it('starts holding again for work that arrives after the last lot ran', () => {
    const schedule = gatheredScheduler(50);
    const ran: string[] = [];

    schedule(() => {
      ran.push('first');
    });
    vi.advanceTimersByTime(50);
    schedule(() => {
      ran.push('later');
    });

    expect(ran).toEqual(['first']);

    vi.advanceTimersByTime(50);

    expect(ran).toEqual(['first', 'later']);
  });
});
