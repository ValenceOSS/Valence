import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  forgetTheAudiobookPlayer,
  theAudiobookPlayer,
} from '@ValenceClient/books/theAudiobookPlayer';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { forgetTheMusicPlayer, theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

afterEach(() => {
  forgetTheAudiobookPlayer();
  forgetTheMusicPlayer();
});

const anAudio = (): ListeningAudio => ({
  src: '',
  currentTime: 0,
  duration: Number.NaN,
  playbackRate: 1,
  paused: true,
  play: () => Promise.resolve(),
  pause: vi.fn(),
  addEventListener: () => {},
});

describe('theAudiobookPlayer', () => {
  it('is one player for the whole client', () => {
    expect(theAudiobookPlayer()).toBe(theAudiobookPlayer());
  });

  it('starts from nothing once it has been forgotten', () => {
    const before = theAudiobookPlayer();

    forgetTheAudiobookPlayer();

    expect(theAudiobookPlayer()).not.toBe(before);
    expect(theAudiobookPlayer().read().book).toBeNull();
  });

  it('plays through the audio the host hands it, asking for it only once', () => {
    const audio = anAudio();
    const listeningAudio = vi.fn(() => audio);
    const { book, chapters } = anAudiobook();

    installPlatform(aFakePlatform({ listeningAudio }));
    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    theAudiobookPlayer();

    expect(listeningAudio).toHaveBeenCalledTimes(1);
    expect(audio.src).toContain(book.id);
  });

  it('stops the book it was playing as it is forgotten', () => {
    const audio = anAudio();
    const { book, chapters } = anAudiobook();

    installPlatform(aFakePlatform({ listeningAudio: () => audio }));
    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    forgetTheAudiobookPlayer();

    expect(audio.src).toBe('');
  });

  it('pauses the book as the music starts', () => {
    const audio = anAudio();
    const heard = new Map<string, () => void>();
    const music: AudioLike = {
      src: '',
      currentTime: 0,
      duration: Number.NaN,
      volume: 1,
      muted: false,
      paused: true,
      play: () => Promise.resolve(),
      pause: () => {},
      addEventListener: (type, listener) => {
        heard.set(type, listener);
      },
    };
    const { book, chapters } = anAudiobook();

    installPlatform(
      aFakePlatform({
        listeningAudio: () => audio,
        musicAudio: () => ({ audio: music, canPlay: () => true }),
      }),
    );
    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    theMusicPlayer().play([aTrack(1)], 0);
    heard.get('playing')?.();

    expect(audio.pause).toHaveBeenCalled();
  });
});
