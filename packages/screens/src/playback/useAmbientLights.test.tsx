import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AMBIENT_GRID } from '@ValenceScreens/playback/AMBIENT_GRID';
import { useAmbientLights } from './useAmbientLights';

const draw = vi.fn();

const context = {
  drawImage: draw,
  getImageData: () => ({ data: new Uint8ClampedArray(48 * 27 * 4).fill(200) }),
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
  it('reads the picture several times a second while it is on', () => {
    const ref = { current: aVideo() };

    renderHook(() => useAmbientLights(ref, true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(draw.mock.calls.length).toBeGreaterThanOrEqual(20);
  });

  it('does not look at all while it is off', () => {
    const ref = { current: aVideo() };

    renderHook(() => useAmbientLights(ref, false));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(draw).not.toHaveBeenCalled();
  });

  it('gives a colour for each cell of the grid over the picture', () => {
    const ref = { current: aVideo() };
    const { result } = renderHook(() => useAmbientLights(ref, true));

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current).toHaveLength(AMBIENT_GRID.columns * AMBIENT_GRID.rows);
    expect(result.current[0]).toBe('rgb(200 200 200)');
  });

  it('keeps its last colours where the picture cannot be read', () => {
    const ref = { current: aVideo() };

    draw.mockImplementation(() => {
      throw new Error('tainted');
    });

    const { result } = renderHook(() => useAmbientLights(ref, true));

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toHaveLength(AMBIENT_GRID.columns * AMBIENT_GRID.rows);
    expect(result.current[0]).toBe('rgb(40 40 40)');
  });

  it('stops looking once it is turned off', () => {
    const ref = { current: aVideo() };
    const { rerender } = renderHook(({ isOn }) => useAmbientLights(ref, isOn), {
      initialProps: { isOn: true },
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ isOn: false });
    draw.mockClear();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(draw).not.toHaveBeenCalled();
  });
});
