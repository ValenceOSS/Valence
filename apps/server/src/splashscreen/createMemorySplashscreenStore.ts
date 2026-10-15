import { createMemoryPictureStore } from '@ValenceServer/pictures/createMemoryPictureStore';
import { SPLASHSCREEN_LIMITS } from './SplashscreenStore';
import { splashscreenAddress } from './splashscreenAddress';
import type { SplashscreenStore } from './SplashscreenStore';

/**
 * The picture behind the way in, held in memory, so the routes can be exercised without a disk.
 * Judges a picture exactly as the real store does, so a refusal a test sees is one a person would.
 *
 * @returns The store.
 */
const createMemorySplashscreenStore = (): SplashscreenStore =>
  createMemoryPictureStore({
    prefix: 'splashscreen',
    address: splashscreenAddress,
    limits: SPLASHSCREEN_LIMITS,
  });

export { createMemorySplashscreenStore };
