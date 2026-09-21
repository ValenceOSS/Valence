import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFullscreen } from './useFullscreen';

const holder: { fullscreenElement: Element | null } = { fullscreenElement: null };

const exitFullscreen = vi.fn<() => Promise<void>>();

beforeEach(() => {
  holder.fullscreenElement = null;
  exitFullscreen.mockReset().mockResolvedValue(undefined);

  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => holder.fullscreenElement,
  });
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen });
});

afterEach(() => {
  Reflect.deleteProperty(document, 'fullscreenElement');
  Reflect.deleteProperty(document, 'fullscreenEnabled');
  Reflect.deleteProperty(document, 'exitFullscreen');
});

describe('useFullscreen', () => {
  it('says whether the browser will allow it', () => {
    const { result } = renderHook(() => useFullscreen({ current: document.body }));

    expect(result.current.isAvailable).toBe(true);
  });

  it('asks the element to fill the screen when it does not', () => {
    const element = document.createElement('div');
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(element, 'requestFullscreen', { value: requestFullscreen });

    const { result } = renderHook(() => useFullscreen({ current: element }));

    act(() => {
      result.current.toggle();
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('puts the screen back when it does', () => {
    const element = document.createElement('div');

    holder.fullscreenElement = element;

    const { result } = renderHook(() => useFullscreen({ current: element }));

    act(() => {
      result.current.toggle();
    });

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });

  it('follows the browser in and out of full screen', () => {
    const element = document.createElement('div');
    const { result } = renderHook(() => useFullscreen({ current: element }));

    expect(result.current.isFullscreen).toBe(false);

    act(() => {
      holder.fullscreenElement = element;
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.isFullscreen).toBe(true);

    act(() => {
      holder.fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.isFullscreen).toBe(false);
  });
});
