import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  forgetTheAudiobookPlayer,
  listenAs,
  theAudiobookPlayer,
  whoIsListening,
} from '@ValenceClient/books/theAudiobookPlayer';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { forgetTheMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { listenedOffline, rememberListenedOffline } from '@ValenceClient/offline/listenedOffline';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { controlDevice, readControlledDevice } from '@ValenceClient/video/controlledDevice';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import { letGoOfTheProfile } from './letGoOfTheProfile';
import { profileLetGo } from './profileLetGo';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

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

beforeEach(() => {
  installPlatform(aFakePlatform({ listeningAudio: () => anAudio() }));
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  forgetTheAudiobookPlayer();
  forgetTheMusicPlayer();
  controlDevice(null);
  vi.unstubAllGlobals();
});

describe('letGoOfTheProfile', () => {
  it('saves the place in the book playing before it is done', async () => {
    const { book, chapters } = anAudiobook();

    theAudiobookPlayer().open(book, tracksOf(chapters), null);
    await letGoOfTheProfile();

    expect(fetchMock).toHaveBeenCalledWith(`/api/books/${book.id}/listening`, expect.anything());
    expect(theAudiobookPlayer().read().book).toBeNull();
  });

  it('sends nothing kept offline, which waits for the profile to be back', async () => {
    const { book, chapters } = anAudiobook();

    listenAs('dan');
    rememberListenedOffline(
      book.id,
      { chapterId: tracksOf(chapters)[0]?.id ?? '', positionSeconds: 30, isFinished: false },
      Date.now(),
      'dan',
    );
    await letGoOfTheProfile();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(listenedOffline(book.id, 'dan')).not.toBeNull();
  });

  it('leaves nobody listening once let go of, so nothing more is sent as them', async () => {
    listenAs('dan');
    await letGoOfTheProfile();

    expect(whoIsListening()).toBeNull();
  });

  it('forgets the television this device was the remote for', async () => {
    controlDevice({ clientId: 'tv', label: 'Living room' });
    await letGoOfTheProfile();

    expect(readControlledDevice()).toBeNull();
  });

  it('tells whatever else the profile was in that it was let go of', async () => {
    const listener = vi.fn();
    const stop = profileLetGo.subscribe(listener);

    await letGoOfTheProfile();
    stop();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('waits only so long for a server that does not answer', async () => {
    const { book, chapters } = anAudiobook();

    fetchMock.mockImplementation(() => new Promise(() => undefined));
    theAudiobookPlayer().open(book, tracksOf(chapters), null);

    await expect(letGoOfTheProfile(10)).resolves.toBeUndefined();
    expect(theAudiobookPlayer().read().book).toBeNull();
  });
});
