import { describe, expect, it } from 'vitest';
import { theBrowsersListeningAudio } from '@ValenceScreens/listening/theBrowsersListeningAudio';
import { theBrowserAudio } from '@ValenceScreens/music/theBrowserAudio';

describe('theBrowsersListeningAudio', () => {
  it('is an element of its own, apart from the music', () => {
    const audio = theBrowsersListeningAudio();

    expect(audio).not.toBe(theBrowserAudio().audio);
    expect(audio.preload).toBe('auto');
  });
});
