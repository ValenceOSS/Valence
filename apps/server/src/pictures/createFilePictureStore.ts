import { randomUUID } from 'node:crypto';
import {
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { forgetPicture } from './forgetPicture';
import { keepPicture } from './keepPicture';
import { readPicture } from './readPicture';
import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureStore } from './PictureStore';

/**
 * A picture the server keeps one of — the picture behind the way in, the server's own logo — as a
 * file beside the profile pictures, with its name held in the server's settings.
 *
 * Beside the profile pictures because it shares their rules: the upload is the only copy of itself,
 * so it lives on the volume that survives, not in the cache that may be thrown away, and what is
 * handed out is a cleaned copy of it, never the upload itself. Each picture gets a
 * name of its own, so a replaced one is a different address and nothing that cached the old one goes
 * on drawing it; the old file is removed once the new one is in force.
 *
 * @param options - Where the file is kept, how its name is read and written, what it is called, the
 *   address it is served at, and how large it may be.
 * @returns The store.
 */
const createFilePictureStore = ({
  directory,
  current,
  keep,
  prefix,
  address,
  limits,
}: {
  directory: string;
  current: () => Promise<string | null>;
  keep: (file: string | null) => Promise<void>;
  prefix: string;
  address: (file: string) => string;
  limits: PictureLimits;
}): PictureStore => {
  const forget = async (file: string): Promise<void> => {
    await forgetPicture(directory, file);
  };

  return {
    read: async () => {
      const file = await current();

      if (file === null) {
        return null;
      }

      return readPicture(directory, file);
    },

    address: async () => {
      const file = await current();

      return file === null ? null : address(file);
    },

    save: async (picture) => {
      const wrong = await whatIsWrongWithThePicture(picture, limits);

      if (wrong !== null) {
        return wrong;
      }

      const before = await current();
      const file = `${prefix}-${randomUUID()}${extensionFor(picture.contentType) ?? '.jpg'}`;

      const unkept = await keepPicture(directory, file, picture.body);

      if (unkept !== null) {
        return unkept;
      }

      await keep(file);

      if (before !== null) {
        await forget(before);
      }

      return null;
    },

    remove: async () => {
      const before = await current();

      if (before === null) {
        return false;
      }

      await keep(null);
      await forget(before);

      return true;
    },
  };
};

export { createFilePictureStore };
