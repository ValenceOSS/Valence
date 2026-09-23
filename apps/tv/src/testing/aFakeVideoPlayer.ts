type Said = Record<string, string | number | boolean | null | { message: string }>;

type Heard = (payload: Said) => void;

type FakeVideoPlayer = {
  currentTime: number;
  duration: number;
  playing: boolean;
  muted: boolean;
  playbackRate: number;
  bufferedPosition: number;
  videoTrack: null;
  audioTrack: null;
  subtitleTrack: null;
  availableSubtitleTracks: never[];
  availableAudioTracks: never[];
  play: jest.Mock;
  pause: jest.Mock;
  replaceAsync: jest.Mock;
  replace: jest.Mock;
  release: jest.Mock;
  addListener: (event: string, heard: Heard) => { remove: () => void };
  tell: (event: string, payload?: Said) => void;
};

/**
 * A stand-in for expo-video's player: it remembers what it was asked to do, and a test can tell it
 * that something happened — it loaded, it started playing, it reached the end — to see what the
 * screen does next.
 *
 * @returns The player.
 */
const aFakeVideoPlayer = (): FakeVideoPlayer => {
  const heard = new Map<string, Set<Heard>>();

  return {
    currentTime: 0,
    duration: 0,
    playing: false,
    muted: false,
    playbackRate: 1,
    bufferedPosition: 0,
    videoTrack: null,
    audioTrack: null,
    subtitleTrack: null,
    availableSubtitleTracks: [],
    availableAudioTracks: [],
    play: jest.fn(),
    pause: jest.fn(),
    replaceAsync: jest.fn(() => Promise.resolve()),
    replace: jest.fn(),
    release: jest.fn(),
    addListener: (event, listener) => {
      const listeners = heard.get(event) ?? new Set<Heard>();

      listeners.add(listener);
      heard.set(event, listeners);

      return {
        remove: () => {
          listeners.delete(listener);
        },
      };
    },
    tell: (event, payload = {}) => {
      heard.get(event)?.forEach((listener) => {
        listener(payload);
      });
    },
  };
};

export type { FakeVideoPlayer };

export { aFakeVideoPlayer };
