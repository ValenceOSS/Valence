import { describe, expect, it, vi } from 'vitest';
import { reloadWhenCodeIsGone } from './reloadWhenCodeIsGone';

const aWindow = () => {
  const events = new EventTarget();
  const storage = new Map<string, string>();
  const reload = vi.fn();

  return {
    events,
    reload,
    target: {
      addEventListener: (type: 'vite:preloadError', listener: (event: Event) => void) => {
        events.addEventListener(type, listener);
      },
      location: { reload },
      navigator: { onLine: true },
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    },
  };
};

describe('reloadWhenCodeIsGone', () => {
  it('reloads once when old code has gone, and not again within a few seconds', () => {
    const { events, target, reload } = aWindow();
    let now = 100_000;

    reloadWhenCodeIsGone(target, () => now);
    events.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    now += 1_000;
    events.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

    expect(reload).toHaveBeenCalledTimes(1);

    now += 20_000;
    events.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('leaves an offline page as it is', () => {
    const { events, target, reload } = aWindow();

    target.navigator.onLine = false;
    reloadWhenCodeIsGone(target);
    events.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

    expect(reload).not.toHaveBeenCalled();
  });
});
