import { readFile, readdir, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  FACE_LIMITS,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { FACE_FOLDERS } from '@ValenceServer/pictures/FACE_FOLDERS';
import { keepFace } from '@ValenceServer/pictures/keepFace';
import { framedNameOf } from '@ValenceServer/pictures/framedNameOf';
import { processedNameOf } from '@ValenceServer/pictures/processedNameOf';
import { upgradeFaces } from '@ValenceServer/pictures/upgradeFaces';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

const KEPT_AS = ['.jpg', '.png', '.webp', '.avif', '.gif'] as const;

type ServerPicture = { body: Uint8Array; contentType: string };

type ServerPictures = {
  save: (key: string, picture: ServerPicture) => Promise<PictureFault | null>;
  read: (key: string) => Promise<ServerPicture | null>;
  remove: (key: string) => Promise<void>;
  upgrade: (onProblem: (name: string, reason: Error) => void) => Promise<void>;
};

/**
 * Keeps the pictures servers are shown with — this one's own, and a copy of each linked server's —
 * in one folder, each under its own key, checked as a face is and kept as a face is: the upload as
 * it came, and the pictures made from it. A server is never framed, so the square in the middle of
 * its picture is the one shown, which every app draws the same as the whole picture in a circle.
 *
 * @param directory - The folder they are kept in.
 * @returns The pictures.
 */
const createServerPictures = (directory: string): ServerPictures => {
  const remove = async (key: string) => {
    await Promise.all([
      ...KEPT_AS.flatMap((extension) => [
        rm(join(directory, `${key}${extension}`), { force: true }),
        rm(join(directory, FACE_FOLDERS.originals, `${key}${extension}`), { force: true }),
      ]),
      rm(join(directory, FACE_FOLDERS.processed, processedNameOf(key)), { force: true }),
      rm(join(directory, FACE_FOLDERS.processed, framedNameOf(key)), { force: true }),
    ]);
  };

  return {
    save: async (key, picture) => {
      const wrong = await whatIsWrongWithThePicture(picture, FACE_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      await remove(key);

      return keepFace(
        directory,
        `${key}${extensionFor(picture.contentType) ?? '.png'}`,
        picture.body,
        null,
      );
    },

    read: async (key) => {
      const body = await readFile(join(directory, FACE_FOLDERS.processed, framedNameOf(key))).catch(
        () => null,
      );

      return body === null ? null : { body, contentType: 'image/webp' };
    },

    remove,

    upgrade: async (onProblem) => {
      const picturesIn = async (folder: string) =>
        (await readdir(folder, { withFileTypes: true }).catch(() => []))
          .filter((entry) => entry.isFile())
          .map((entry) => entry.name)
          .filter((name) => KEPT_AS.some((extension) => extension === extname(name)));

      await upgradeFaces(
        directory,
        [
          ...(await picturesIn(directory)),
          ...(await picturesIn(join(directory, FACE_FOLDERS.originals))),
        ].map((name) => ({ name, frame: null })),
        onProblem,
      );
    },
  };
};

export type { ServerPicture, ServerPictures };

export { createServerPictures };
