import { describe, expect, it, vi } from 'vitest';
import { waitThenRun } from './waitThenRun';

describe('waitThenRun', () => {
  it('runs once the time has passed, unless stopped first', () => {
    vi.useFakeTimers();

    const ran = vi.fn();
    const stopped = vi.fn();

    waitThenRun(ran, 100);
    waitThenRun(stopped, 100)();
    vi.advanceTimersByTime(100);

    expect(ran).toHaveBeenCalledTimes(1);
    expect(stopped).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
