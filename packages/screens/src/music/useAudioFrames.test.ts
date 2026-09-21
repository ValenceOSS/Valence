import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioFrames } from './useAudioFrames';

class FakeContext {
  destination = {};

  createAnalyser() {
    return {
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 512,
      getByteFrequencyData: (into: Uint8Array) => {
        into.fill(255);
      },
      getByteTimeDomainData: (into: Uint8Array) => {
        into.fill(200);
      },
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

const SIZE = { width: 800, height: 600 };

const TIME = { seconds: 2, delta: 0.016 };

beforeEach(() => {
  vi.stubGlobal('AudioContext', FakeContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAudioFrames', () => {
  it('is not listening, and reads silence, until somebody is looking', () => {
    const element = playing();
    const { result } = renderHook(() => useAudioFrames(element, false));
    const frame = result.current.read(SIZE, TIME, 120);

    expect(result.current.isListening).toBe(false);
    expect(frame.bass).toBe(0);
    expect(frame.spectrum(8).every((bar) => bar === 0)).toBe(true);
  });

  it('carries the size, the time and the hue into the frame', () => {
    const { result } = renderHook(() => useAudioFrames(null, true));
    const frame = result.current.read(SIZE, TIME, 120);

    expect(frame).toMatchObject({ width: 800, height: 600, seconds: 2, delta: 0.016, hue: 120 });
  });

  it('listens once it is on, and reads what the analyser hears', () => {
    const element = playing();
    const { result } = renderHook(() => useAudioFrames(element, true));
    const frame = result.current.read(SIZE, TIME, 0);

    expect(result.current.isListening).toBe(true);
    expect(frame.bass).toBeGreaterThan(0.5);
    expect(frame.wave(16).some((point) => point !== 0)).toBe(true);
  });

  it('says it cannot hear where the browser has no way to', () => {
    vi.stubGlobal('AudioContext', undefined);

    const element = playing();
    const { result } = renderHook(() => useAudioFrames(element, true));

    expect(result.current.isListening).toBe(false);
  });
});
