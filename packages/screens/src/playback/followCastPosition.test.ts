import { describe, expect, it, vi } from 'vitest';
import { followCastPosition } from '@ValenceScreens/playback/followCastPosition';
import type { CastCarrier, CastRemotePlayer } from '@ValenceScreens/playback/castSender.types';

/**
 * A Cast framework whose one remote player can be moved and told to say so.
 *
 * @returns The framework, the player, and how to make it say its position changed.
 */
const aFramework = () => {
  const player: CastRemotePlayer = { isConnected: true, isMediaLoaded: true, currentTime: 0 };
  const listeners = new Set<() => void>();
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
        },
        RemotePlayerController: class {
          addEventListener = (_: string, listener: () => void) => {
            listeners.add(listener);
          };
          removeEventListener = (_: string, listener: () => void) => {
            listeners.delete(listener);
          };
        },
        RemotePlayerEventType: { CURRENT_TIME_CHANGED: 'currentTimeChanged' },
      },
    },
  };

  return {
    carrier,
    player,
    moveTo: (seconds: number) => {
      player.currentTime = seconds;

      for (const listener of listeners) {
        listener();
      }
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

  it('does nothing where the Cast framework has no remote player', () => {
    expect(() => {
      followCastPosition(vi.fn(), {})();
    }).not.toThrow();
  });
});
