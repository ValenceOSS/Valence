import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetTheBrowserAudio, theBrowserAudio } from '@ValenceScreens/music/theBrowserAudio';

afterEach(() => {
  forgetTheBrowserAudio();
});

describe('theBrowserAudio', () => {
  it('is the one element the window plays through', () => {
    expect(theBrowserAudio().audio).toBe(theBrowserAudio().audio);
  });

  it('is a fresh element once it has been forgotten', () => {
    const before = theBrowserAudio().audio;

    forgetTheBrowserAudio();

    expect(theBrowserAudio().audio).not.toBe(before);
  });

  it('can play a kind of file the element says it might', () => {
    const { audio, canPlay } = theBrowserAudio();

    vi.spyOn(audio, 'canPlayType').mockImplementation((type) =>
      type === 'audio/flac' ? 'maybe' : '',
    );

    expect(canPlay('audio/flac')).toBe(true);
    expect(canPlay('audio/x-unknown')).toBe(false);
  });

  it('loads ahead, so a song starts without waiting', () => {
    expect(theBrowserAudio().audio.preload).toBe('auto');
  });
});
