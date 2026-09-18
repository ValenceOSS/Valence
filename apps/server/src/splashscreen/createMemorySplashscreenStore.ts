import { whatIsWrongWithThePicture } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { SPLASHSCREEN_LIMITS } from './SplashscreenStore';
import { splashscreenAddress } from './splashscreenAddress';
import type { Splashscreen, SplashscreenStore } from './SplashscreenStore';

/**
 * The picture behind the way in, held in memory, so the routes can be exercised without a disk.
 * Judges a picture exactly as the real store does, so a refusal a test sees is one a person would.
 *
 * @returns The store.
 */
const createMemorySplashscreenStore = (): SplashscreenStore => {
  let held: (Splashscreen & { file: string }) | null = null;
  let saved = 0;

  return {
    read: () =>
      Promise.resolve(held === null ? null : { body: held.body, contentType: held.contentType }),

    address: () => Promise.resolve(held === null ? null : splashscreenAddress(held.file)),

    save: async (picture) => {
      const wrong = await whatIsWrongWithThePicture(picture, SPLASHSCREEN_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      saved += 1;
      held = { ...picture, file: `splashscreen-${saved.toString()}` };

      return null;
    },

    remove: () => {
      const had = held !== null;

      held = null;

      return Promise.resolve(had);
    },
  };
};

export { createMemorySplashscreenStore };
