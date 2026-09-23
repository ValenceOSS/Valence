import { afterEach, describe, expect, it } from 'vitest';
import { forgetTheMusicPlayer, theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';

afterEach(() => {
  forgetTheMusicPlayer();
});

describe('theMusicPlayer', () => {
  it('is one player for the whole client', () => {
    expect(theMusicPlayer()).toBe(theMusicPlayer());
  });

  it('starts from nothing once it has been forgotten', () => {
    const before = theMusicPlayer();

    forgetTheMusicPlayer();

    expect(theMusicPlayer()).not.toBe(before);
  });
});
