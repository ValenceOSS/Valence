import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

const IDLE: MusicPlayerState = {
  queue: null,
  current: null,
  isPlaying: false,
  isLoading: false,
  positionSeconds: 0,
  durationSeconds: 0,
  volume: 0.8,
  isMuted: false,
  quality: 'lossless',
  playingQuality: null,
  problem: null,
  remote: null,
};

/**
 * A music player that plays nothing and records what it was told, for a screen to be drawn against,
 * whichever test runner is recording: Vitest on the web, Jest on a native client.
 *
 * @param spy - Makes a function that remembers how it was called, such as `vi.fn` or `jest.fn`.
 * @param start - What it should say it is doing.
 * @returns The player, and a way to change what it says it is doing.
 */
const aFakeMusicPlayerWith = (
  spy: () => () => void,
  start: Partial<MusicPlayerState> = {},
): { player: MusicPlayer; set: (change: Partial<MusicPlayerState>) => void } => {
  let state: MusicPlayerState = { ...IDLE, ...start };
  const listeners = new Set<() => void>();

  const player = {
    read: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    play: spy(),
    toggle: spy(),
    pause: spy(),
    resume: spy(),
    next: spy(),
    previous: spy(),
    seek: spy(),
    setVolume: spy(),
    toggleMute: spy(),
    toggleShuffle: spy(),
    cycleRepeat: spy(),
    playNext: spy(),
    addToQueue: spy(),
    jumpTo: spy(),
    removeFromQueue: spy(),
    moveInQueue: spy(),
    setQuality: spy(),
    stop: spy(),
    leave: spy(),
    playOn: spy(),
    playHere: spy(),
    obey: spy(),
    mirror: spy(),
  } satisfies MusicPlayer;

  return {
    player,
    set: (change: Partial<MusicPlayerState>) => {
      state = { ...state, ...change };

      for (const listener of listeners) {
        listener();
      }
    },
  };
};

export { aFakeMusicPlayerWith };
