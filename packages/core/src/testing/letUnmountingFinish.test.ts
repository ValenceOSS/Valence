import { afterEach, describe, expect, it, vi } from 'vitest';
import { letUnmountingFinish } from './letUnmountingFinish';

afterEach(() => {
  vi.useRealTimers();
});

describe('letUnmountingFinish', () => {
  it('waits for a timer set as something unmounted', async () => {
    const left = vi.fn();

    setTimeout(left, 0);
    await letUnmountingFinish();

    expect(left).toHaveBeenCalledOnce();
  });

  it('still finishes while a test has the timers faked', async () => {
    vi.useFakeTimers();

    await expect(letUnmountingFinish()).resolves.toBeUndefined();
  });
});
