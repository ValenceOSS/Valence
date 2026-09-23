import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import type * as InstallPlatform from '@ValenceClient/platform/installPlatform';
import type * as TheTvsMusicAudio from '@ValenceTv/music/theTvsMusicAudio';

type Status = {
  playbackState?: string;
  isLoaded?: boolean;
  isBuffering?: boolean;
  playing?: boolean;
  didJustFinish?: boolean;
};

type ASystemPlayer = {
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playing: boolean;
  play: jest.Mock;
  pause: jest.Mock;
  replace: jest.Mock;
  seekTo: jest.Mock;
  addListener: (event: string, listener: (status: Status) => void) => { remove: () => void };
  say: (status: Status) => void;
};

const mockPlayers: ASystemPlayer[] = [];

const mockSetAudioMode = jest.fn<Promise<void>, [object]>(() => Promise.resolve());

const mockASystemPlayer = (): ASystemPlayer => {
  const listeners: ((status: Status) => void)[] = [];
  const made: ASystemPlayer = {
    currentTime: 12,
    duration: 0,
    volume: 1,
    muted: false,
    playing: false,
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    addListener: (_event, listener) => {
      listeners.push(listener);

      return { remove: () => undefined };
    },
    say: (status) => {
      for (const listener of listeners) {
        listener({
          playbackState: 'readyToPlay',
          isLoaded: true,
          isBuffering: false,
          playing: false,
          didJustFinish: false,
          ...status,
        });
      }
    },
  };

  mockPlayers.push(made);

  return made;
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: () => mockASystemPlayer(),
  setAudioModeAsync: (mode: object) => mockSetAudioMode(mode),
}));

const fresh = (): typeof TheTvsMusicAudio => {
  jest.resetModules();
  mockPlayers.length = 0;

  const platform = aFakePlatform({ thisClientKind: () => 'tv' });

  platform.store.write('valence.server.address', 'http://valence.local:3000');
  platform.store.write('valence.tv.session', 'secret');
  jest
    .requireActual<typeof InstallPlatform>('@ValenceClient/platform/installPlatform')
    .installPlatform(platform);

  return jest.requireActual<typeof TheTvsMusicAudio>('@ValenceTv/music/theTvsMusicAudio');
};

const theSystem = (): ASystemPlayer => {
  const made = mockPlayers[0];

  if (made === undefined) {
    throw new Error('No system player was made');
  }

  return made;
};

const listening = (audio: ReturnType<typeof TheTvsMusicAudio.theTvsMusicAudio>['audio']) => {
  const heard: string[] = [];

  for (const type of [
    'loadedmetadata',
    'canplay',
    'waiting',
    'playing',
    'pause',
    'timeupdate',
    'seeked',
    'ended',
    'error',
  ]) {
    audio.addEventListener(type, () => {
      heard.push(type);
    });
  }

  return heard;
};

describe('theTvsMusicAudio', () => {
  it('is made once, and plays in the background', () => {
    const { theTvsMusicAudio, theTvsMusicPlayer } = fresh();

    expect(theTvsMusicAudio()).toBe(theTvsMusicAudio());
    expect(mockPlayers).toHaveLength(1);
    expect(theTvsMusicPlayer()).toBe(theSystem());
    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ shouldPlayInBackground: true }),
    );
  });

  it('opens a song on the server, signed as this television', () => {
    const { audio } = fresh().theTvsMusicAudio();
    const heard = listening(audio);

    audio.src = '/api/music/tracks/1/stream';

    expect(audio.src).toBe('/api/music/tracks/1/stream');
    expect(theSystem().replace).toHaveBeenCalledWith({
      uri: 'http://valence.local:3000/api/music/tracks/1/stream',
      headers: { authorization: 'Bearer secret' },
    });
    expect(heard).toEqual(['waiting']);
  });

  it('empties the player when the song is taken away', () => {
    const { audio } = fresh().theTvsMusicAudio();

    audio.src = '';

    expect(theSystem().replace).toHaveBeenCalledWith(null);
  });

  it('turns what the system says as it plays into the element’s events', () => {
    const { audio } = fresh().theTvsMusicAudio();
    const heard = listening(audio);
    const system = theSystem();

    system.say({ isLoaded: true });
    system.say({ isBuffering: true });
    system.say({ isBuffering: false, playing: true });
    system.say({ playing: false });
    system.say({ playing: false, didJustFinish: true });

    expect(heard).toEqual([
      'loadedmetadata',
      'canplay',
      'timeupdate',
      'waiting',
      'timeupdate',
      'canplay',
      'playing',
      'timeupdate',
      'pause',
      'timeupdate',
      'timeupdate',
      'ended',
    ]);
  });

  it('does not say it paused when the song finished', () => {
    const { audio } = fresh().theTvsMusicAudio();
    const heard = listening(audio);
    const system = theSystem();

    system.say({ playing: true });
    heard.length = 0;
    system.say({ playing: false, didJustFinish: true });

    expect(heard).toEqual(['timeupdate', 'ended']);
  });

  it('says a song failed only once', () => {
    const { audio } = fresh().theTvsMusicAudio();
    const heard = listening(audio);

    theSystem().say({ playbackState: 'failed' });
    theSystem().say({ playbackState: 'failed' });

    expect(heard).toEqual(['error']);
  });

  it('says a new song failed after an earlier one did', () => {
    const { audio } = fresh().theTvsMusicAudio();
    const heard = listening(audio);

    theSystem().say({ playbackState: 'failed' });
    audio.src = '/api/music/tracks/2/stream';
    theSystem().say({ playbackState: 'failed' });

    expect(heard.filter((type) => type === 'error')).toHaveLength(2);
  });

  it('knows no length until the song has loaded', () => {
    const { audio } = fresh().theTvsMusicAudio();

    theSystem().duration = 200;

    expect(audio.duration).toBeNaN();

    theSystem().say({ isLoaded: true });

    expect(audio.duration).toBe(200);
  });

  it('moves through the song and says when it has', async () => {
    const { audio } = fresh().theTvsMusicAudio();
    const heard = listening(audio);

    expect(audio.currentTime).toBe(12);

    audio.currentTime = 30;
    await Promise.resolve();
    await Promise.resolve();

    expect(theSystem().seekTo).toHaveBeenCalledWith(30);
    expect(heard).toEqual(['timeupdate', 'seeked']);
  });

  it('plays, pauses and sets the volume on the system’s player', async () => {
    const { audio } = fresh().theTvsMusicAudio();
    const system = theSystem();

    await audio.play();
    audio.pause();
    audio.volume = 0.4;
    audio.muted = true;
    system.playing = true;

    expect(system.play).toHaveBeenCalledTimes(1);
    expect(system.pause).toHaveBeenCalledTimes(1);
    expect(audio.volume).toBe(0.4);
    expect(audio.muted).toBe(true);
    expect(audio.paused).toBe(false);
  });

  it('plays every kind of file but Ogg', () => {
    const { canPlay } = fresh().theTvsMusicAudio();

    expect(canPlay('audio/flac')).toBe(true);
    expect(canPlay('audio/ogg; codecs="opus"')).toBe(false);
    expect(canPlay('audio/ogg; codecs="vorbis"')).toBe(false);
  });

  it('makes the audio when the player is asked for first', () => {
    const { theTvsMusicPlayer } = fresh();

    expect(theTvsMusicPlayer()).toBe(theSystem());
    expect(mockPlayers).toHaveLength(1);
  });
});
