import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeepsTheScreenOn } from './useKeepsTheScreenOn';

const aLock = () => {
  const release = vi.fn(() => Promise.resolve());
  const request = vi.fn(() => Promise.resolve({ release }));

  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });

  return { request, release };
};

const told = () => {
  const heard: boolean[] = [];
  const listener = (event: Event) => {
    heard.push(event instanceof CustomEvent && event.detail === true);
  };

  document.addEventListener('valence:keep-the-screen-on', listener);

  return heard;
};

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('useKeepsTheScreenOn', () => {
  it('holds a screen wake lock while it is on, and lets it go after', async () => {
    const { request, release } = aLock();
    const { rerender } = renderHook(({ isOn }) => useKeepsTheScreenOn(isOn), {
      initialProps: { isOn: true },
    });

    await vi.waitFor(() => {
      expect(request).toHaveBeenCalledWith('screen');
    });

    rerender({ isOn: false });

    expect(release).toHaveBeenCalledOnce();
  });

  it('asks for nothing while it is off', () => {
    const { request } = aLock();

    renderHook(() => useKeepsTheScreenOn(false));

    expect(request).not.toHaveBeenCalled();
  });

  it('tells Valence’s own window, which holds the screen on where a browser will not', () => {
    const heard = told();
    const { unmount } = renderHook(() => useKeepsTheScreenOn(true));

    unmount();

    expect(heard).toEqual([true, false]);
  });

  it('asks again when the page comes back into view', async () => {
    const { request } = aLock();

    renderHook(() => useKeepsTheScreenOn(true));
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2);
    });
  });

  it('carries on where the browser has no wake lock', () => {
    expect(() => renderHook(() => useKeepsTheScreenOn(true))).not.toThrow();
  });
});
