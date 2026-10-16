import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  contentTypeFor,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureStore } from './PictureStore';

/**
 * A picture the server keeps one of — the picture behind the way in, the server's own logo — as a
 * file beside the profile pictures, with its name held in the server's settings.
 *
 * Beside the profile pictures because it shares their one rule: it is the only copy of itself, so it
 * lives on the volume that survives, not in the cache that may be thrown away. Each picture gets a
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
    await unlink(join(directory, file)).catch(() => undefined);
  };

  return {
    read: async () => {
      const file = await current();

      if (file === null) {
        return null;
      }

      const body = await readFile(join(directory, file)).catch(() => null);

      return body === null
        ? null
        : { body, contentType: contentTypeFor(extname(file)) ?? 'image/jpeg' };
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

      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, file), picture.body);
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
