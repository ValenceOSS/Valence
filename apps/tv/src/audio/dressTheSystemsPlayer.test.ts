import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { createAudioPlayer } from 'expo-audio';
import { dressTheSystemsPlayer } from '@ValenceTv/audio/dressTheSystemsPlayer';

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
  playbackRate: number;
  play: jest.Mock;
  pause: jest.Mock;
  replace: jest.Mock;
  seekTo: jest.Mock;
  setPlaybackRate: jest.Mock;
  addListener: (event: string, listener: (status: Status) => void) => { remove: () => void };
  say: (status: Status) => void;
};

const mockPlayers: ASystemPlayer[] = [];

const mockASystemPlayer = (): ASystemPlayer => {
  const listeners: ((status: Status) => void)[] = [];
  const made: ASystemPlayer = {
    currentTime: 12,
    duration: 0,
    volume: 1,
    muted: false,
    playing: false,
    playbackRate: 1,
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setPlaybackRate: jest.fn(),
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
}));

const dressed = (): { audio: ReturnType<typeof dressTheSystemsPlayer>; system: ASystemPlayer } => {
  const platform = aFakePlatform({ thisClientKind: () => 'tv' });

  platform.store.write('valence.server.address', 'http://valence.local:3000');
  platform.store.write('valence.tv.session', 'secret');
  installPlatform(platform);

  mockPlayers.length = 0;

  const audio = dressTheSystemsPlayer(createAudioPlayer(null));
  const system = mockPlayers[0];

  if (system === undefined) {
    throw new Error('No system player was made');
  }

  return { audio, system };
};

const listening = (audio: ReturnType<typeof dressTheSystemsPlayer>) => {
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

describe('dressTheSystemsPlayer', () => {
  it('opens a song on the server, signed as this television', () => {
    const { audio, system } = dressed();
    const heard = listening(audio);

    audio.src = '/api/music/tracks/1/stream';

    expect(audio.src).toBe('/api/music/tracks/1/stream');
    expect(system.replace).toHaveBeenCalledWith({
      uri: 'http://valence.local:3000/api/music/tracks/1/stream',
      headers: { authorization: 'Bearer secret' },
    });
    expect(heard).toEqual(['waiting']);
  });

  it('stops the player where it is when the file is taken away', () => {
    const { audio, system } = dressed();

    audio.src = '';

    expect(audio.src).toBe('');
    expect(system.pause).toHaveBeenCalled();
    expect(system.replace).not.toHaveBeenCalled();
  });

  it('turns what the system says as it plays into the element’s events', () => {
    const { audio, system } = dressed();
    const heard = listening(audio);

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
    const { audio, system } = dressed();
    const heard = listening(audio);

    system.say({ playing: true });
    heard.length = 0;
    system.say({ playing: false, didJustFinish: true });

    expect(heard).toEqual(['timeupdate', 'ended']);
  });

  it('says a song failed only once', () => {
    const { audio, system } = dressed();
    const heard = listening(audio);

    system.say({ playbackState: 'failed' });
    system.say({ playbackState: 'failed' });

    expect(heard).toEqual(['error']);
  });

  it('says a new song failed after an earlier one did', () => {
    const { audio, system } = dressed();
    const heard = listening(audio);

    system.say({ playbackState: 'failed' });
    audio.src = '/api/music/tracks/2/stream';
    system.say({ playbackState: 'failed' });

    expect(heard.filter((type) => type === 'error')).toHaveLength(2);
  });

  it('knows no length until the song has loaded', () => {
    const { audio, system } = dressed();

    system.duration = 200;

    expect(audio.duration).toBeNaN();

    system.say({ isLoaded: true });

    expect(audio.duration).toBe(200);
  });

  it('moves through the song and says when it has', async () => {
    const { audio, system } = dressed();
    const heard = listening(audio);

    expect(audio.currentTime).toBe(12);

    audio.currentTime = 30;
    await Promise.resolve();
    await Promise.resolve();

    expect(system.seekTo).toHaveBeenCalledWith(30);
    expect(heard).toEqual(['timeupdate', 'seeked']);
  });

  it('plays, pauses and sets the volume on the system’s player', async () => {
    const { audio, system } = dressed();

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

  it('plays faster without raising the voice', () => {
    const { audio, system } = dressed();

    audio.playbackRate = 1.5;
    system.playbackRate = 1.5;

    expect(system.setPlaybackRate).toHaveBeenCalledWith(1.5, 'high');
    expect(audio.playbackRate).toBe(1.5);
  });
});
