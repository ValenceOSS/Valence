import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAmbientLights } from './useAmbientLights';

const draw = vi.fn();

const context = {
  drawImage: draw,
  getImageData: () => ({ data: new Uint8ClampedArray(32 * 18 * 4).fill(200) }),
};

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => context,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'getContext');
  draw.mockReset();
});

const aVideo = (): HTMLVideoElement => {
  const video = document.createElement('video');

  Object.defineProperty(video, 'videoWidth', { value: 1920 });

  return video;
};

describe('useAmbientLights', () => {
  it('reads the picture every half second while it is on', () => {
    const ref = { current: aVideo() };

    renderHook(() => useAmbientLights(ref, true));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(draw.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('does not look at all while it is off', () => {
    const ref = { current: aVideo() };

    renderHook(() => useAmbientLights(ref, false));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(draw).not.toHaveBeenCalled();
  });

  it('gives a colour for each quarter of what it read', () => {
    const ref = { current: aVideo() };
    const { result } = renderHook(() => useAmbientLights(ref, true));

    expect(result.current).toHaveLength(4);
    expect(result.current[0]).toBe('rgb(200 200 200)');
  });

  it('keeps its last colours where the picture cannot be read', () => {
    const ref = { current: aVideo() };

    draw.mockImplementation(() => {
      throw new Error('tainted');
    });

    const { result } = renderHook(() => useAmbientLights(ref, true));

    expect(result.current).toHaveLength(4);
  });
});
