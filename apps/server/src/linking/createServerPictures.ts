import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  FACE_LIMITS,
  contentTypeFor,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

const KEPT_AS = ['.jpg', '.png', '.webp', '.avif', '.gif'] as const;

type ServerPicture = { body: Uint8Array; contentType: string };

type ServerPictures = {
  save: (key: string, picture: ServerPicture) => Promise<PictureFault | null>;
  read: (key: string) => Promise<ServerPicture | null>;
  remove: (key: string) => Promise<void>;
};

/**
 * Keeps the pictures servers are shown with — this one's own, and a copy of each linked server's —
 * as files in one folder, each under its own key, checked as a face is before it is kept.
 *
 * @param directory - The folder they are kept in.
 * @returns The pictures.
 */
const createServerPictures = (directory: string): ServerPictures => {
  const remove = async (key: string) => {
    await Promise.all(
      KEPT_AS.map((extension) => rm(join(directory, `${key}${extension}`), { force: true })),
    );
  };

  return {
    save: async (key, picture) => {
      const wrong = await whatIsWrongWithThePicture(picture, FACE_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      await mkdir(directory, { recursive: true });
      await remove(key);
      await writeFile(
        join(directory, `${key}${extensionFor(picture.contentType) ?? '.png'}`),
        picture.body,
      );

      return null;
    },

    read: async (key) => {
      for (const extension of KEPT_AS) {
        const body = await readFile(join(directory, `${key}${extension}`)).catch(() => null);

        if (body !== null) {
          return { body, contentType: contentTypeFor(extension) ?? 'image/png' };
        }
      }

      return null;
    },

    remove,
  };
};

export type { ServerPicture, ServerPictures };

export { createServerPictures };
