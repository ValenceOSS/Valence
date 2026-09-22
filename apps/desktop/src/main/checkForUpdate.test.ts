import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkForUpdate } from './checkForUpdate';
import type { Updater } from './checkForUpdate';
import type { UpdateCheckResult } from 'electron-updater';

const aUpdater = (
  checkForUpdates: () => Promise<UpdateCheckResult | null> = () => Promise.resolve(null),
) => {
  const listeners: Array<(info: { version: string }) => void> = [];

  const updater: Updater = {
    checkForUpdates,
    on: (_event, listener) => {
      listeners.push(listener);
    },
  };

  return {
    updater,
    downloaded: (info: { version: string }) => {
      for (const listener of listeners) {
        listener(info);
      }
    },
  };
};

describe('checkForUpdate', () => {
  let stop: (() => void) | null = null;

  afterEach(() => {
    stop?.();
    stop = null;
  });

  it('says so once a download finishes', () => {
    const onReadyToInstall = vi.fn();
    const { updater, downloaded } = aUpdater();

    const checker = checkForUpdate({ updater, every: 100_000, onReadyToInstall });

    stop = checker.stop;

    downloaded({ version: '1.1.0' });

    expect(onReadyToInstall).toHaveBeenCalledWith({ version: '1.1.0' });
  });

  it('says nothing where nothing has downloaded', async () => {
    const onReadyToInstall = vi.fn();
    const { updater } = aUpdater();

    const checker = checkForUpdate({ updater, every: 100_000, onReadyToInstall });

    stop = checker.stop;

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(onReadyToInstall).not.toHaveBeenCalled();
  });

  it('asks once as soon as it starts', () => {
    let asked = 0;
    const { updater } = aUpdater(() => {
      asked += 1;

      return Promise.resolve(null);
    });

    const checker = checkForUpdate({ updater, every: 100_000, onReadyToInstall: vi.fn() });

    stop = checker.stop;

    expect(asked).toBe(1);
  });

  it('says nothing where the check itself fails', async () => {
    const onReadyToInstall = vi.fn();
    const { updater } = aUpdater(() => Promise.reject(new Error('offline')));

    const checker = checkForUpdate({ updater, every: 100_000, onReadyToInstall });

    stop = checker.stop;

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(onReadyToInstall).not.toHaveBeenCalled();
  });

  it('checks again once the interval passes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    let asked = 0;
    const { updater } = aUpdater(() => {
      asked += 1;

      return Promise.resolve(null);
    });

    const checker = checkForUpdate({ updater, every: 50, onReadyToInstall: vi.fn() });

    stop = checker.stop;

    await vi.advanceTimersByTimeAsync(10);
    expect(asked).toBe(1);

    await vi.advanceTimersByTimeAsync(60);
    expect(asked).toBe(2);

    vi.useRealTimers();
  });

  it('checks no more once stopped', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    let asked = 0;
    const { updater } = aUpdater(() => {
      asked += 1;

      return Promise.resolve(null);
    });

    const checker = checkForUpdate({ updater, every: 50, onReadyToInstall: vi.fn() });

    await vi.advanceTimersByTimeAsync(10);
    checker.stop();
    await vi.advanceTimersByTimeAsync(200);

    expect(asked).toBe(1);

    vi.useRealTimers();
  });
});
