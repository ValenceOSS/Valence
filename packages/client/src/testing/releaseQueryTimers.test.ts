import { timeoutManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { releaseQueryTimers } from './releaseQueryTimers';

afterEach(() => {
  timeoutManager.setTimeoutProvider({
    setTimeout: (callback, delay) => setTimeout(callback, delay),
    clearTimeout: (timer) => {
      clearTimeout(timer);
    },
    setInterval: (callback, delay) => setInterval(callback, delay),
    clearInterval: (timer) => {
      clearInterval(timer);
    },
  });
});

describe('releaseQueryTimers', () => {
  it('sets query timers that do not keep a process open', () => {
    releaseQueryTimers();

    const timer = timeoutManager.setTimeout(() => undefined, 60_000);
    const hasRef = typeof timer === 'object' && 'hasRef' in timer ? timer.hasRef : null;
    const isHeld = typeof hasRef === 'function' ? Boolean(hasRef.call(timer)) : true;

    timeoutManager.clearTimeout(timer);

    expect(isHeld).toBe(false);
  });

  it('still runs a query timer when its time comes', async () => {
    releaseQueryTimers();

    const ran = vi.fn();

    timeoutManager.setTimeout(ran, 0);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(ran).toHaveBeenCalledOnce();
  });
});
