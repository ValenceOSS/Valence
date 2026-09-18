import { useSyncExternalStore } from 'react';

type MusicPanel = 'queue' | 'devices' | 'party' | null;

let open: MusicPanel = null;

const listeners = new Set<() => void>();

/**
 * Opens a panel beside the music section, or closes whichever is open.
 *
 * @param panel - The panel to open, or nothing to close.
 */
const setMusicPanel = (panel: MusicPanel): void => {
  open = panel;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Starts listening for the panel changing.
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
 * Reads which panel sits beside the music section — the queue or the devices — so the player bar
 * that opens it and the section that draws it agree, wherever each is on the page.
 *
 * @returns The panel open, or nothing.
 */
const useMusicPanel = (): MusicPanel =>
  useSyncExternalStore(
    subscribe,
    () => open,
    () => open,
  );

export type { MusicPanel };

export { setMusicPanel, useMusicPanel };
