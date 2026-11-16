import { describe, expect, it, vi } from 'vitest';
import { followCastPosition } from '@ValenceScreens/playback/followCastPosition';
import type { CastCarrier, CastRemotePlayer } from '@ValenceScreens/playback/castSender.types';

/**
 * A Cast framework whose one remote player can be moved and told to say so.
 *
 * @returns The framework, the player, and how to make it say its position changed.
 */
const aFramework = () => {
  const player: CastRemotePlayer = {
    isConnected: true,
    isMediaLoaded: true,
    currentTime: 0,
    isPaused: false,
  };
  const listeners = new Map<string, Set<() => void>>();
  const tell = (event: string) => {
    for (const listener of listeners.get(event) ?? []) {
      listener();
    }
  };
  const carrier: CastCarrier = {
    cast: {
      framework: {
        CastContext: { getInstance: vi.fn() },
        CastContextEventType: { CAST_STATE_CHANGED: 'caststatechanged' },
        RemotePlayer: class {
          get isConnected() {
            return player.isConnected;
          }
          get isMediaLoaded() {
            return player.isMediaLoaded;
          }
          get currentTime() {
            return player.currentTime;
          }
          get isPaused() {
            return player.isPaused ?? false;
          }
        },
        RemotePlayerController: class {
          addEventListener = (event: string, listener: () => void) => {
            listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
          };
          removeEventListener = (event: string, listener: () => void) => {
            listeners.get(event)?.delete(listener);
          };
        },
        RemotePlayerEventType: {
          CURRENT_TIME_CHANGED: 'currentTimeChanged',
          IS_PAUSED_CHANGED: 'isPausedChanged',
        },
      },
    },
  };

  return {
    carrier,
    player,
    moveTo: (seconds: number) => {
      player.currentTime = seconds;
      tell('currentTimeChanged');
    },
    pauseIt: (isPaused: boolean) => {
      player.isPaused = isPaused;
      tell('isPausedChanged');
    },
  };
};

describe('followCastPosition', () => {
  it('says each position the device being cast to reaches', () => {
    const { carrier, moveTo } = aFramework();
    const heard = vi.fn();

    followCastPosition(heard, carrier);
    moveTo(42.5);

    expect(heard).toHaveBeenCalledWith(42.5);
  });

  it('says nothing once the device has let the media go', () => {
    const { carrier, player, moveTo } = aFramework();
    const heard = vi.fn();

    followCastPosition(heard, carrier);
    player.isMediaLoaded = false;
    moveTo(0);

    expect(heard).not.toHaveBeenCalled();
  });

  it('stops following when asked', () => {
    const { carrier, moveTo } = aFramework();
    const heard = vi.fn();

    followCastPosition(heard, carrier)();
    moveTo(10);

    expect(heard).not.toHaveBeenCalled();
  });

  it('says when the device starts and stops playing', () => {
    const { carrier, pauseIt } = aFramework();
    const playing = vi.fn();

    followCastPosition(vi.fn(), carrier, playing);
    pauseIt(true);
    pauseIt(false);

    expect(playing.mock.calls).toEqual([[false], [true]]);
  });

  it('stops hearing whether it plays when asked', () => {
    const { carrier, pauseIt } = aFramework();
    const playing = vi.fn();

    followCastPosition(vi.fn(), carrier, playing)();
    pauseIt(true);

    expect(playing).not.toHaveBeenCalled();
  });

  it('does nothing where the Cast framework has no remote player', () => {
    expect(() => {
      followCastPosition(vi.fn(), {})();
    }).not.toThrow();
  });
});
