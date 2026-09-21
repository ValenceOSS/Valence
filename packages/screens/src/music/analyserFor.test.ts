import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyserFor } from '@ValenceScreens/music/analyserFor';

const connect = vi.fn();
const resume = vi.fn().mockResolvedValue(undefined);
const created = vi.fn();

class FakeContext {
  destination = {};

  constructor() {
    created();
  }

  createAnalyser() {
    return { fftSize: 0, smoothingTimeConstant: 0, connect };
  }

  createMediaElementSource() {
    return { connect };
  }

  resume = resume;
}

const elementFrom = (src: string): HTMLAudioElement => {
  const element = new Audio();

  element.src = src;

  return element;
};

beforeEach(() => {
  connect.mockClear();
  resume.mockClear();
  created.mockClear();
  vi.stubGlobal('AudioContext', FakeContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('analyserFor', () => {
  it('routes the element through an analyser and on to the speakers', () => {
    const analyser = analyserFor(elementFrom('/api/music/tracks/1/stream'));

    expect(analyser).not.toBeNull();
    expect(connect).toHaveBeenCalledTimes(2);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('gives the same analyser back for the same element, since it can be routed only once', () => {
    const element = elementFrom('/api/music/tracks/1/stream');

    expect(analyserFor(element)).toBe(analyserFor(element));
    expect(created).toHaveBeenCalledTimes(1);
  });

  it('leaves sound from another origin alone rather than turning it to silence', () => {
    expect(analyserFor(elementFrom('https://elsewhere.example/song.mp3'))).toBeNull();
    expect(created).not.toHaveBeenCalled();
  });

  it('does nothing where this browser has no Web Audio', () => {
    vi.stubGlobal('AudioContext', undefined);

    expect(analyserFor(elementFrom('/api/music/tracks/1/stream'))).toBeNull();
  });

  it('gives up quietly when the browser will not route the element', () => {
    connect.mockImplementationOnce(() => {
      throw new Error('already connected');
    });

    expect(analyserFor(elementFrom('/api/music/tracks/2/stream'))).toBeNull();
  });
});
