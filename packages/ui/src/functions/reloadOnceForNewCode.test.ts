import { describe, expect, it, vi } from 'vitest';
import { reloadOnceForNewCode } from './reloadOnceForNewCode';

const aWindow = (isOnline = true) => {
  const storage = new Map<string, string>();
  const reload = vi.fn();

  return {
    reload,
    target: {
      location: { reload },
      navigator: { onLine: isOnline },
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    },
  };
};

describe('reloadOnceForNewCode', () => {
  it('reloads once, and not again within a few seconds', () => {
    const { target, reload } = aWindow();

    expect(reloadOnceForNewCode(target, () => 100_000)).toBe(true);
    expect(reloadOnceForNewCode(target, () => 105_000)).toBe(false);
    expect(reloadOnceForNewCode(target, () => 120_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('never reloads a page that has gone offline', () => {
    const { target, reload } = aWindow(false);

    expect(reloadOnceForNewCode(target)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
