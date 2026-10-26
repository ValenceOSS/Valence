import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetTheKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { forgetTheMusicPlayer, theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

afterEach(() => {
  forgetTheMusicPlayer();
  forgetTheKeptListening();
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

  it('lets go of the audio the host handed it as it is forgotten', () => {
    const release = vi.fn();

    installPlatform(
      aFakePlatform({
        musicAudio: () => ({ audio: { ...anAudio(), release }, canPlay: () => true }),
      }),
    );
    theMusicPlayer();
    forgetTheMusicPlayer();

    expect(release).toHaveBeenCalledOnce();
  });

  it('plays a song this device keeps from the device rather than the server', () => {
    const audio = anAudio();
    const name = `track-${aTrack(1).id}-lossless.flac`;
    const platform = aFakePlatform({
      listeningFiles: aFakeListeningFiles().files,
      musicAudio: () => ({ audio, canPlay: () => true }),
    });

    platform.store.write(
      'valence.kept.listening',
      JSON.stringify({ files: [{ name, from: '/api/music/tracks', state: 'here' }] }),
    );
    installPlatform(platform);
    theMusicPlayer().play([aTrack(1), aTrack(2)], 0);

    expect(audio.src).toBe(`file:///kept/${name}`);
  });

  it('plays a song this device does not keep from the server', () => {
    const audio = anAudio();

    installPlatform(
      aFakePlatform({
        listeningFiles: aFakeListeningFiles().files,
        musicAudio: () => ({ audio, canPlay: () => true }),
      }),
    );
    theMusicPlayer().play([aTrack(1)], 0);

    expect(audio.src).toContain(`/api/music/tracks/${aTrack(1).id}/stream`);
  });
});
