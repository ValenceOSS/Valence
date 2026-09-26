import { afterEach, describe, expect, it, vi } from 'vitest';
import { askUntilReady } from './askUntilReady';

afterEach(() => {
  vi.useRealTimers();
});

describe('askUntilReady', () => {
  it('asks again until the render is ready', async () => {
    vi.useFakeTimers();

    const answers = [{ isReady: false }, { isReady: false }, { isReady: true }];
    const ask = vi.fn(() => Promise.resolve(answers.shift() ?? { isReady: true }));

    const asking = askUntilReady({ ask, isCancelled: undefined });

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(asking).resolves.toBe(true);
    expect(ask).toHaveBeenCalledTimes(3);
  });

  it('gives up within a moment of the job being stopped, not at the next ask', async () => {
    vi.useFakeTimers();

    let stopped = false;
    const ask = vi.fn(() => Promise.resolve({ isReady: false }));

    const asking = askUntilReady({ ask, isCancelled: () => stopped });

    await vi.advanceTimersByTimeAsync(1_000);
    stopped = true;
    await vi.advanceTimersByTimeAsync(300);

    await expect(asking).resolves.toBe(false);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('does not ask again once the job has been stopped', async () => {
    const ask = vi.fn(() => Promise.resolve({ isReady: false }));

    await expect(askUntilReady({ ask, isCancelled: () => true })).resolves.toBe(false);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('passes a failed render on to whoever asked', async () => {
    const ask = () => Promise.reject(new Error('ffmpeg produced no clip'));

    await expect(askUntilReady({ ask, isCancelled: undefined })).rejects.toThrow(
      'ffmpeg produced no clip',
    );
  });
});
