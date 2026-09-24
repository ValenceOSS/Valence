import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inTime } from './inTime';

const LATE = () => new Error('Too late');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('inTime', () => {
  it('gives what the task gives in time, and disposes of nothing', async () => {
    const discard = vi.fn();

    await expect(inTime(Promise.resolve('tab'), 1000, { failure: LATE, discard })).resolves.toBe(
      'tab',
    );
    expect(discard).not.toHaveBeenCalled();
  });

  it('fails a task that runs past its time, and says so to it', async () => {
    const onLate = vi.fn();
    const failing = expect(
      inTime(new Promise(() => undefined), 1000, { failure: LATE, onLate }),
    ).rejects.toThrow('Too late');

    await vi.advanceTimersByTimeAsync(1000);
    await failing;
    expect(onLate).toHaveBeenCalledTimes(1);
  });

  it('disposes of what a late task gives when it gives it', async () => {
    const discard = vi.fn();
    const held: { finish?: (value: string) => void } = {};
    const task = new Promise<string>((resolve) => {
      held.finish = resolve;
    });
    const failing = expect(inTime(task, 1000, { failure: LATE, discard })).rejects.toThrow(
      'Too late',
    );

    await vi.advanceTimersByTimeAsync(1000);
    await failing;
    held.finish?.('tab');
    await vi.advanceTimersByTimeAsync(0);

    expect(discard).toHaveBeenCalledWith('tab');
  });

  it('passes on a task’s own failure', async () => {
    await expect(
      inTime(Promise.reject(new Error('gone')), 1000, { failure: LATE }),
    ).rejects.toThrow('gone');
  });
});
