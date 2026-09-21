import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpectrum } from '@ValenceScreens/music/useSpectrum';

const heardNow = vi.fn((into: Uint8Array) => {
  into.fill(255);
});

class FakeContext {
  destination = {};

  createAnalyser() {
    return {
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: heardNow,
      connect: vi.fn(),
    };
  }

  createMediaElementSource() {
    return { connect: vi.fn() };
  }

  resume = vi.fn().mockResolvedValue(undefined);
}

const playing = (): HTMLAudioElement => {
  const element = new Audio();

  element.src = '/api/music/tracks/9/stream';

  return element;
};

beforeEach(() => {
  heardNow.mockClear();
  vi.stubGlobal('AudioContext', FakeContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSpectrum', () => {
  it('hears nothing until somebody is looking', () => {
    const { result } = renderHook(() => useSpectrum(playing(), false));

    expect(result.current(4)).toEqual([]);
    expect(heardNow).not.toHaveBeenCalled();
  });

  it('answers a height for every bar once it is on', () => {
    const element = playing();
    const { result } = renderHook(() => useSpectrum(element, true));

    expect(result.current(4)).toEqual([1, 1, 1, 1]);
  });

  it('hears nothing where there is no element', () => {
    const { result } = renderHook(() => useSpectrum(null, true));

    expect(result.current(4)).toEqual([]);
  });

  it('hears nothing where the browser will not route the sound', () => {
    vi.stubGlobal('AudioContext', undefined);

    const element = playing();
    const { result } = renderHook(() => useSpectrum(element, true));

    expect(result.current(4)).toEqual([]);
  });
});
