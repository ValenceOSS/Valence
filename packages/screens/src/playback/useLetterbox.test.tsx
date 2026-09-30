import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLetterbox } from './useLetterbox';

const SIDE = 320;

let barRows = 32;

/**
 * Paints the sample a video would give, black above and below its picture.
 *
 * @returns The sample's pixels.
 */
const sample = (): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(SIDE * SIDE * 4);

  for (let y = 0; y < SIDE; y += 1) {
    const isBar = y < barRows || y >= SIDE - barRows;

    for (let x = 0; x < SIDE; x += 1) {
      pixels.set(isBar ? [0, 0, 0, 255] : [180, 160, 140, 255], (y * SIDE + x) * 4);
    }
  }

  return pixels;
};

beforeEach(() => {
  vi.useFakeTimers();
  barRows = 32;
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => ({ drawImage: vi.fn(), getImageData: () => ({ data: sample() }) }),
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'getContext');
});

const aVideo = (): HTMLVideoElement => {
  const video = document.createElement('video');

  Object.defineProperty(video, 'videoWidth', { value: 1920 });
  Object.defineProperty(video, 'videoHeight', { value: 1080 });

  return video;
};

describe('useLetterbox', () => {
  it('takes the shape of the video until bars have held across several looks', () => {
    const ref = { current: aVideo() };
    const { result } = renderHook(() => useLetterbox(ref, true));

    expect(result.current.rows).toBe(0);
    expect(result.current.ratio).toBeCloseTo(1920 / 1080);
  });

  it('crops bars burned into the picture once they have held', () => {
    const ref = { current: aVideo() };
    const { result } = renderHook(() => useLetterbox(ref, true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.rows).toBeCloseTo(0.1);
    expect(result.current.ratio).toBeCloseTo(1920 / (1080 * 0.8));
  });

  it('believes the thinnest bar seen lately, so a dark shot cannot crop the picture', () => {
    const ref = { current: aVideo() };
    const { result } = renderHook(() => useLetterbox(ref, true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    barRows = 96;
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.rows).toBeCloseTo(0.1);
  });

  it('does not look while nothing is using the shape', () => {
    const ref = { current: aVideo() };
    const { result } = renderHook(() => useLetterbox(ref, false));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toEqual({ ratio: 16 / 9, rows: 0, columns: 0 });
  });
});
