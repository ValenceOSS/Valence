import { createLightStore } from '@ValenceScreens/library/createLightStore';
import type { MoodLight } from '@ValenceUI/MoodBackground.types';

const homeLights = createLightStore();

/**
 * Lights the home page with the colours of whatever its hero is showing.
 *
 * @param lights - The lights, or none to leave the room unlit.
 */
const setHomeLights = (lights: readonly MoodLight[]): void => {
  homeLights.set(lights);
};

/**
 * The colours the home page is lit with.
 *
 * @returns The lights.
 */
const useHomeLights = (): readonly MoodLight[] => homeLights.use();

export { setHomeLights, useHomeLights };
