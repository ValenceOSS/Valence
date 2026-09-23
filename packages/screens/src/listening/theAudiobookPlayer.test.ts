import { afterEach, describe, expect, it } from 'vitest';
import {
  forgetTheAudiobookPlayer,
  theAudiobookPlayer,
} from '@ValenceScreens/listening/theAudiobookPlayer';
import { forgetTheMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';

afterEach(() => {
  forgetTheAudiobookPlayer();
  forgetTheMusicPlayer();
});

describe('theAudiobookPlayer', () => {
  it('is one player for the whole window', () => {
    expect(theAudiobookPlayer()).toBe(theAudiobookPlayer());
  });

  it('starts from nothing once it has been forgotten', () => {
    const before = theAudiobookPlayer();

    forgetTheAudiobookPlayer();

    expect(theAudiobookPlayer()).not.toBe(before);
    expect(theAudiobookPlayer().read().book).toBeNull();
  });
});
