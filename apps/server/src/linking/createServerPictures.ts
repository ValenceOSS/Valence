import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  FACE_LIMITS,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { PhotoFrameSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { PICTURE_FOLDERS } from '@ValenceServer/pictures/PICTURE_FOLDERS';
import { keepFace } from '@ValenceServer/pictures/keepFace';
import { keepPicture } from '@ValenceServer/pictures/keepPicture';
import { framedNameOf } from '@ValenceServer/pictures/framedNameOf';
import { processedNameOf } from '@ValenceServer/pictures/processedNameOf';
import { readPicture } from '@ValenceServer/pictures/readPicture';
import { upgradeFaces } from '@ValenceServer/pictures/upgradeFaces';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

const KEPT_AS = ['.jpg', '.png', '.webp', '.avif', '.gif'] as const;

type ServerPicture = { body: Uint8Array; contentType: string };

type ServerPictures = {
  save: (
    key: string,
    picture: ServerPicture,
    frame?: PhotoFrame | null,
  ) => Promise<PictureFault | null>;
  read: (key: string) => Promise<ServerPicture | null>;
  remove: (key: string) => Promise<void>;
  upgrade: (onProblem: (name: string, reason: Error) => void) => Promise<void>;
};

/**
 * Keeps pictures in one folder, each under its own key, checked as a face is: the upload as it came,
 * and the copies made from it. A round picture — a server's — is cut to the part of it its frame
 * chose, which is kept beside it so the cut can be made again; one drawn whole — a live channel's,
 * often a wide logo — is handed out whole.
 *
 * @param directory - The folder they are kept in.
 * @param isRound - Whether the pictures are shown in a circle.
 * @returns The pictures.
 */
const createServerPictures = (directory: string, isRound = true): ServerPictures => {
  const frameFileOf = (key: string) => join(directory, `${key}.frame.json`);

  const frameOf = async (key: string): Promise<PhotoFrame | null> => {
    const kept = await readFile(frameFileOf(key), 'utf8').catch(() => null);

    if (kept === null) {
      return null;
    }

    try {
      const read = PhotoFrameSchema.safeParse(JSON.parse(kept));

      return read.success ? read.data : null;
    } catch {
      return null;
    }
  };

  const remove = async (key: string) => {
    await Promise.all([
      ...KEPT_AS.flatMap((extension) => [
        rm(join(directory, `${key}${extension}`), { force: true }),
        rm(join(directory, PICTURE_FOLDERS.originals, `${key}${extension}`), { force: true }),
      ]),
      rm(join(directory, PICTURE_FOLDERS.processed, processedNameOf(key)), { force: true }),
      rm(join(directory, PICTURE_FOLDERS.processed, framedNameOf(key)), { force: true }),
      rm(frameFileOf(key), { force: true }),
    ]);
  };

  return {
    save: async (key, picture, frame = null) => {
      const wrong = await whatIsWrongWithThePicture(picture, FACE_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      await remove(key);

      const name = `${key}${extensionFor(picture.contentType) ?? '.png'}`;

      if (!isRound) {
        return keepPicture(directory, name, picture.body);
      }

      const unkept = await keepFace(directory, name, picture.body, frame);

      if (unkept === null && frame !== null) {
        await writeFile(frameFileOf(key), JSON.stringify(frame));
      }

      return unkept;
    },

    read: async (key) => {
      if (!isRound) {
        return readPicture(directory, key);
      }

      const body = await readFile(
        join(directory, PICTURE_FOLDERS.processed, framedNameOf(key)),
      ).catch(() => null);

      return body === null ? null : { body, contentType: 'image/webp' };
    },

    remove,

    upgrade: async (onProblem) => {
      const picturesIn = async (folder: string) =>
        (await readdir(folder, { withFileTypes: true }).catch(() => []))
          .filter((entry) => entry.isFile())
          .map((entry) => entry.name)
          .filter((name) => KEPT_AS.some((extension) => extension === extname(name)));
      const names = [
        ...(await picturesIn(directory)),
        ...(await picturesIn(join(directory, PICTURE_FOLDERS.originals))),
      ];

      await upgradeFaces(
        directory,
        await Promise.all(
          names.map(async (name) => ({
            name,
            frame: await frameOf(name.slice(0, name.length - extname(name).length)),
          })),
        ),
        onProblem,
      );
    },
  };
};

export type { ServerPicture, ServerPictures };

export { createServerPictures };
