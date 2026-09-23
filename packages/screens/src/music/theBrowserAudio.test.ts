import { afterEach, describe, expect, it } from 'vitest';
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
});
