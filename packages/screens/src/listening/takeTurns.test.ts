import { describe, expect, it, vi } from 'vitest';
import { takeTurns } from '@ValenceScreens/listening/takeTurns';

/**
 * A player that only says whether it is playing, and can be told to.
 *
 * @returns The player, and a way to set whether it plays.
 */
const aPlayable = () => {
  const listeners = new Set<() => void>();
  let isPlaying = false;
  const player = {
    read: () => ({ isPlaying }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    pause: vi.fn(() => {
      set(false);
    }),
  };
  const set = (next: boolean) => {
    isPlaying = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  return { player, set };
};

describe('takeTurns', () => {
  it('pauses one as the other starts, either way round', () => {
    const book = aPlayable();
    const music = aPlayable();

    takeTurns(book.player, music.player);
    music.set(true);
    book.set(true);

    expect(music.player.pause).toHaveBeenCalledTimes(1);
    expect(music.player.read().isPlaying).toBe(false);

    music.set(true);

    expect(book.player.pause).toHaveBeenCalledTimes(1);
  });

  it('leaves the other alone once it has stopped', () => {
    const book = aPlayable();
    const music = aPlayable();
    const stop = takeTurns(book.player, music.player);

    music.set(true);
    stop();
    book.set(true);

    expect(music.player.pause).not.toHaveBeenCalled();
  });
});
