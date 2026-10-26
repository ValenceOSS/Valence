import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  forgetTheAudiobookPlayer,
  theAudiobookPlayer,
} from '@ValenceClient/books/theAudiobookPlayer';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { forgetTheKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { forgetTheMusicPlayer, theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { listenedOffline, rememberListenedOffline } from '@ValenceClient/offline/listenedOffline';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aTrack } from '@ValenceClient/testing/aTrack';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

afterEach(() => {
  forgetTheAudiobookPlayer();
  forgetTheMusicPlayer();
  forgetTheKeptListening();
  vi.unstubAllGlobals();
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

  it('lets go of the audio the host handed it as it is forgotten', () => {
    const release = vi.fn();

    installPlatform(aFakePlatform({ listeningAudio: () => ({ ...anAudio(), release }) }));
    theAudiobookPlayer();
    forgetTheAudiobookPlayer();

    expect(release).toHaveBeenCalledOnce();
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

  it('plays a track of a book this device keeps from the device rather than the server', () => {
    const audio = anAudio();
    const { book, chapters } = anAudiobook();
    const platform = aFakePlatform({
      listeningAudio: () => audio,
      listeningFiles: aFakeListeningFiles().files,
    });

    platform.store.write(
      'valence.kept.listening',
      JSON.stringify({
        files: chapters.map((chapter) => ({
          name: `chapter-${chapter.id}.m4b`,
          from: '/api/books',
          state: 'here',
        })),
      }),
    );
    installPlatform(platform);
    theAudiobookPlayer().open(book, tracksOf(chapters), null);

    expect(audio.src).toBe(`file:///kept/chapter-${tracksOf(chapters)[0]?.id ?? ''}.m4b`);
  });

  it('remembers where somebody got to on this device where the server could not be told', async () => {
    const { book, chapters } = anAudiobook();

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    installPlatform(aFakePlatform({ listeningAudio: () => anAudio() }));
    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    forgetTheAudiobookPlayer();

    await vi.waitFor(() => {
      expect(listenedOffline(book.id)).toEqual({
        chapterId: tracksOf(chapters)[0]?.id,
        positionSeconds: 0,
        isFinished: false,
      });
    });
  });

  it('remembers nothing on this device where the server kept the place', async () => {
    const { book, chapters } = anAudiobook();
    const fetchMock = vi.fn((_path: string) => Promise.resolve({ ok: true }));

    vi.stubGlobal('fetch', fetchMock);
    installPlatform(aFakePlatform({ listeningAudio: () => anAudio() }));
    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    forgetTheAudiobookPlayer();

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`/api/books/${book.id}/listening`, expect.anything());
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(listenedOffline(book.id)).toBeNull();
  });

  it('forgets an older place kept on this device once the server keeps a newer one', async () => {
    const { book, chapters } = anAudiobook();

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true })),
    );
    installPlatform(aFakePlatform({ listeningAudio: () => anAudio() }));
    rememberListenedOffline(book.id, {
      chapterId: tracksOf(chapters)[0]?.id ?? '',
      positionSeconds: 30,
      isFinished: false,
    });
    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    forgetTheAudiobookPlayer();

    await vi.waitFor(() => {
      expect(listenedOffline(book.id)).toBeNull();
    });
  });
});
