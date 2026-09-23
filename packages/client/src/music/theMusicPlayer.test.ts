import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetTheMusicPlayer, theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

afterEach(() => {
  forgetTheMusicPlayer();
});

const anAudio = (): AudioLike => ({
  src: '',
  currentTime: 0,
  duration: Number.NaN,
  volume: 1,
  muted: false,
  paused: true,
  play: () => Promise.resolve(),
  pause: () => {},
  addEventListener: () => {},
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

  it('plays through the audio the host hands it, asking for it only once', () => {
    const audio = anAudio();
    const musicAudio = vi.fn(() => ({ audio, canPlay: () => true }));

    installPlatform(aFakePlatform({ musicAudio }));
    theMusicPlayer().play([aTrack(1)], 0);
    theMusicPlayer();

    expect(musicAudio).toHaveBeenCalledTimes(1);
    expect(audio.src).toContain(aTrack(1).id);
  });
});
