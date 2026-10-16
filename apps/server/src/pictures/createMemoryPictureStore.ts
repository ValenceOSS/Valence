import { whatIsWrongWithThePicture } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { Picture, PictureStore } from './PictureStore';

/**
 * A picture the server keeps one of, held in memory, so the routes can be exercised without a disk.
 * Judges a picture exactly as the real store does, so a refusal a test sees is one a person would.
 *
 * @param options - What it is called, the address it is served at, and how large it may be.
 * @returns The store.
 */
const createMemoryPictureStore = ({
  prefix,
  address,
  limits,
}: {
  prefix: string;
  address: (file: string) => string;
  limits: PictureLimits;
}): PictureStore => {
  let held: (Picture & { file: string }) | null = null;
  let saved = 0;

  return {
    read: () =>
      Promise.resolve(held === null ? null : { body: held.body, contentType: held.contentType }),

    address: () => Promise.resolve(held === null ? null : address(held.file)),

    save: async (picture) => {
      const wrong = await whatIsWrongWithThePicture(picture, limits);

      if (wrong !== null) {
        return wrong;
      }

      saved += 1;
      held = { ...picture, file: `${prefix}-${saved.toString()}` };

      return null;
    },

    remove: () => {
      const had = held !== null;

      held = null;

      return Promise.resolve(had);
    },
  };
};

export { createMemoryPictureStore };
