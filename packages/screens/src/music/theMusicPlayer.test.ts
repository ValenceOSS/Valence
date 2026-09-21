import { afterEach, describe, expect, it } from 'vitest';
import {
  forgetTheMusicPlayer,
  theMusicAudio,
  theMusicPlayer,
} from '@ValenceScreens/music/theMusicPlayer';

afterEach(() => {
  forgetTheMusicPlayer();
});

describe('theMusicPlayer', () => {
  it('is one player for the whole window', () => {
    expect(theMusicPlayer()).toBe(theMusicPlayer());
  });

  it('starts from nothing once it has been forgotten', () => {
    const before = theMusicPlayer();

    forgetTheMusicPlayer();

    expect(theMusicPlayer()).not.toBe(before);
  });
});

describe('theMusicAudio', () => {
  it('is the one element the player plays through', () => {
    expect(theMusicAudio()).toBe(theMusicAudio());
  });

  it('is a fresh element once the player has been forgotten', () => {
    const before = theMusicAudio();

    forgetTheMusicPlayer();

    expect(theMusicAudio()).not.toBe(before);
  });
});
