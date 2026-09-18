import { useSyncExternalStore } from 'react';

let isOpen = false;

const listeners = new Set<() => void>();

/**
 * Opens the immersive view of the song playing, or closes it.
 *
 * @param open - Whether it should be open.
 */
const setMusicImmersive = (open: boolean): void => {
  isOpen = open;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Starts listening for the immersive view opening or closing.
 *
 * @param listener - What to call when it does.
 * @returns A way to stop.
 */
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Reads whether the immersive view of the song playing is open, so the cover on the player bar can
 * open it and the view itself can be drawn wherever the shell keeps it.
 *
 * @returns Whether it is open.
 */
const useMusicImmersive = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => isOpen,
    () => isOpen,
  );

export { setMusicImmersive, useMusicImmersive };
