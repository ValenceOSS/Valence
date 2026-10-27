import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetTheBrowserAudio, theBrowserAudio } from '@ValenceScreens/music/theBrowserAudio';

afterEach(() => {
  forgetTheBrowserAudio();
  vi.restoreAllMocks();
});

describe('theBrowserAudio', () => {
  it('is the one audio the window plays through', () => {
    expect(theBrowserAudio().audio).toBe(theBrowserAudio().audio);
  });

  it('is fresh audio once it has been forgotten', () => {
    const before = theBrowserAudio().audio;

    forgetTheBrowserAudio();

    expect(theBrowserAudio().audio).not.toBe(before);
  });

  it('can play a kind of file the elements say they might', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation((type) =>
      type === 'audio/flac' ? 'maybe' : '',
    );

    const { canPlay } = theBrowserAudio();

    expect(canPlay('audio/flac')).toBe(true);
    expect(canPlay('audio/x-unknown')).toBe(false);
  });

  it('can line up the next song and fade into it', () => {
    const { audio } = theBrowserAudio();

    expect(audio.lineUp).toBeTypeOf('function');
    expect(audio.crossfade).toBeTypeOf('function');
  });
});
