import { useSyncExternalStore } from 'react';
import type { MoodLight } from '@ValenceUI/MoodBackground.types';

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
 * A place one page's lights are kept, apart from the shell, so a picture read several times a
 * second redraws the lights alone rather than the shell and every page under it. Lights the same as
 * the ones already lit are let go, as a picture holding still reads the same each time.
 *
 * @returns A way to set the lights, and a hook that reads them.
 */
const createLightStore = () => {
  let lit: readonly MoodLight[] = [];
  const listeners = new Set<() => void>();

  const set = (lights: readonly MoodLight[]): void => {
    if (lights === lit || isSameLights(lights, lit)) {
      return;
    }

    lit = lights;

    for (const listener of listeners) {
      listener();
    }
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const use = (): readonly MoodLight[] =>
    useSyncExternalStore(
      subscribe,
      () => lit,
      () => lit,
    );

  return { set, use };
};

export { createLightStore };
