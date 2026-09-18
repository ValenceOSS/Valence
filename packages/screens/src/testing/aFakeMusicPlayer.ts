import { vi } from 'vitest';
import type { MusicPlayer, MusicPlayerState } from '@ValenceScreens/music/createMusicPlayer';

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
 * A music player that plays nothing and records what it was told, for a screen to be drawn against.
 *
 * @param start - What it should say it is doing.
 * @returns The player, and a way to change what it says it is doing.
 */
const aFakeMusicPlayer = (
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
    play: vi.fn(),
    toggle: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleShuffle: vi.fn(),
    cycleRepeat: vi.fn(),
    playNext: vi.fn(),
    addToQueue: vi.fn(),
    jumpTo: vi.fn(),
    removeFromQueue: vi.fn(),
    setQuality: vi.fn(),
    stop: vi.fn(),
    playOn: vi.fn(),
    playHere: vi.fn(),
    obey: vi.fn(),
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

export { aFakeMusicPlayer };
