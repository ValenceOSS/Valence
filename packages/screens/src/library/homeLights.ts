import { useSyncExternalStore } from 'react';
import type { MoodLight } from '@ValenceUI/MoodBackground.types';

let lit: readonly MoodLight[] = [];

const listeners = new Set<() => void>();

/**
 * Whether two sets of lights are the same lights, colour for colour, place for place.
 *
 * @param one - One set.
 * @param other - The other.
 * @returns Whether nothing about them differs.
 */
const isSameLights = (one: readonly MoodLight[], other: readonly MoodLight[]): boolean =>
  one.length === other.length &&
  one.every((light, at) => {
    const twin = other[at];

    return (
      twin !== undefined &&
      light.color === twin.color &&
      light.at === twin.at &&
      light.weight === twin.weight
    );
  });

/**
 * Lights the home page with the colours of whatever its hero is showing.
 *
 * Kept here rather than in the shell, so that the hero reading its picture several times a second
 * redraws the lights alone rather than the shell and every page under it. Lights the same as the
 * ones already lit are let go, as a picture that is holding still reads the same each time.
 *
 * @param lights - The lights, or none to leave the room unlit.
 */
const setHomeLights = (lights: readonly MoodLight[]): void => {
  if (lights === lit || isSameLights(lights, lit)) {
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
 * Reads how the home page is lit, so the room behind it can be painted in the colours of the film
 * at the front of it.
 *
 * @returns The lights.
 */
const useHomeLights = (): readonly MoodLight[] =>
  useSyncExternalStore(
    subscribe,
    () => lit,
    () => lit,
  );

export { setHomeLights, useHomeLights };
