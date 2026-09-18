import { useSyncExternalStore } from 'react';
import type { MoodLight } from '@ValenceUI/MoodBackground.types';

let lit: readonly MoodLight[] = [];

const listeners = new Set<() => void>();

/**
 * Lights the music section with the colours of whatever it is showing.
 *
 * @param lights - The lights, or none to leave the room unlit.
 */
const setMusicLights = (lights: readonly MoodLight[]): void => {
  if (lights === lit) {
    return;
  }

  lit = lights;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Starts listening for the lights changing.
 *
 * @param listener - What to call when they do.
 * @returns A way to stop.
 */
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Reads how the music section is lit, so the shell can paint the room behind it in the colours of
 * the album on screen — the way the home page is lit by the film at the front of it.
 *
 * @returns The lights.
 */
const useMusicLights = (): readonly MoodLight[] =>
  useSyncExternalStore(
    subscribe,
    () => lit,
    () => lit,
  );

export { setMusicLights, useMusicLights };
