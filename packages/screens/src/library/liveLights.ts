import { createLightStore } from '@ValenceScreens/library/createLightStore';
import type { MoodLight } from '@ValenceUI/MoodBackground.types';

const liveLights = createLightStore();

/**
 * Lights the live TV page with the colours of the channel playing.
 *
 * @param lights - The lights, or none to leave the room unlit.
 */
const setLiveLights = (lights: readonly MoodLight[]): void => {
  liveLights.set(lights);
};

/**
 * The colours the live TV page is lit with.
 *
 * @returns The lights.
 */
const useLiveLights = (): readonly MoodLight[] => liveLights.use();

export { setLiveLights, useLiveLights };
