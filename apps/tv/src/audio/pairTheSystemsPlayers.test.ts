import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { createAudioPlayer } from 'expo-audio';
import { pairTheSystemsPlayers } from '@ValenceTv/audio/pairTheSystemsPlayers';

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
    currentTime: 0,
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

const aPair = () => {
  const platform = aFakePlatform({ thisClientKind: () => 'tv' });

  platform.store.write('valence.server.address', 'http://valence.local:3000');
  platform.store.write('valence.tv.session', 'secret');
  installPlatform(platform);
  mockPlayers.length = 0;

  const onSwap = jest.fn();
  const audio = pairTheSystemsPlayers(createAudioPlayer(null), createAudioPlayer(null), onSwap);
  const [first, second] = mockPlayers;

  if (first === undefined || second === undefined) {
    throw new Error('No system players were made');
  }

  const heard: string[] = [];

  for (const type of ['advanced', 'ended', 'playing', 'timeupdate', 'loadedmetadata']) {
    audio.addEventListener(type, () => {
      heard.push(type);
    });
  }

  return { audio, first, second, onSwap, heard };
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('pairTheSystemsPlayers', () => {
  it('plays through the first player until a song is lined up', () => {
    const { audio, first, second } = aPair();

    audio.src = '/api/music/tracks/one/stream';

    expect(first.replace).toHaveBeenCalledWith(
      expect.objectContaining({ uri: 'http://valence.local:3000/api/music/tracks/one/stream' }),
    );
    expect(second.replace).not.toHaveBeenCalled();
  });

  it('makes the lined-up song ready on the other player, silently', () => {
    const { audio, second } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.lineUp('/api/music/tracks/two/stream', 0.6);

    expect(second.replace).toHaveBeenCalledWith(
      expect.objectContaining({ uri: 'http://valence.local:3000/api/music/tracks/two/stream' }),
    );
    expect(second.volume).toBe(0);
  });

  it('runs straight on into the lined-up song when the first ends, at its own volume', () => {
    const { audio, first, second, onSwap, heard } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.lineUp('/api/music/tracks/two/stream', 0.6);
    first.say({ didJustFinish: true });

    expect(second.play).toHaveBeenCalled();
    expect(second.volume).toBe(0.6);
    expect(audio.volume).toBe(0.6);
    expect(audio.src).toBe('/api/music/tracks/two/stream');
    expect(onSwap).toHaveBeenCalledWith(second);
    expect(heard).toContain('advanced');
    expect(heard).not.toContain('ended');
  });

  it('says a song ended where nothing was lined up after it', () => {
    const { audio, first, heard } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    first.say({ didJustFinish: true });

    expect(heard).toContain('ended');
    expect(heard).not.toContain('advanced');
  });

  it('hears only the player playing', () => {
    const { audio, second, heard } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.lineUp('/api/music/tracks/two/stream', 0.6);
    second.say({ playing: true });

    expect(heard).not.toContain('playing');
  });

  it('fades into the lined-up song before the end, the two crossing', () => {
    const { audio, first, second, onSwap } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.volume = 0.8;
    audio.crossfade(6);
    audio.lineUp('/api/music/tracks/two/stream', 0.5);
    first.duration = 180;
    first.say({});
    first.currentTime = 175;
    first.say({ playing: true });

    expect(second.play).toHaveBeenCalled();
    expect(onSwap).toHaveBeenCalledWith(second);
    expect(second.volume).toBe(0);

    jest.advanceTimersByTime(3000);

    expect(second.volume).toBeGreaterThan(0);
    expect(second.volume).toBeLessThan(0.5);
    expect(first.volume).toBeGreaterThan(0);
    expect(first.volume).toBeLessThan(0.8);

    jest.advanceTimersByTime(4000);

    expect(second.volume).toBe(0.5);
    expect(first.pause).toHaveBeenCalled();
  });

  it('never fades over more than a third of a short song', () => {
    const { audio, first, second } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.crossfade(12);
    audio.lineUp('/api/music/tracks/two/stream', 0.5);
    first.duration = 9;
    first.say({});
    first.currentTime = 5;
    first.say({ playing: true });

    expect(second.play).not.toHaveBeenCalled();

    first.currentTime = 6;
    first.say({ playing: true });

    expect(second.play).toHaveBeenCalled();
  });

  it('cuts a fade short when paused', () => {
    const { audio, first, second } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.crossfade(6);
    audio.lineUp('/api/music/tracks/two/stream', 0.5);
    first.duration = 180;
    first.say({});
    first.currentTime = 175;
    first.say({ playing: true });
    audio.pause();

    expect(first.pause).toHaveBeenCalled();
    expect(second.pause).toHaveBeenCalled();
    expect(second.volume).toBe(0.5);
  });

  it('turns both players silent when muted', () => {
    const { audio, first, second } = aPair();

    audio.muted = true;

    expect(first.muted).toBe(true);
    expect(second.muted).toBe(true);
    expect(audio.muted).toBe(true);
  });

  it('only changes the volume where the same song is lined up again', () => {
    const { audio, first, second } = aPair();

    audio.src = '/api/music/tracks/one/stream';
    audio.lineUp('/api/music/tracks/two/stream', 0.6);
    audio.lineUp('/api/music/tracks/two/stream', 0.3);

    expect(second.replace).toHaveBeenCalledTimes(1);

    first.say({ didJustFinish: true });

    expect(second.volume).toBe(0.3);
  });
});
