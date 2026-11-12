import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DISK_PICTURE } from '@ValenceServer/library/DISK_PICTURE';
import { artworkNameOf } from './artworkNameOf';

const NAME = /^[0-9a-f]{32}$/u;

type ArtworkNames = {
  nameOf: (url: string) => string | null;
  urlOf: (name: string) => Promise<string | null>;
};

/**
 * Names pictures for serving where anybody may fetch them, and remembers which picture each name
 * stands for, in a small file beside the pictures, so a name handed out before a restart is still
 * understood after it.
 *
 * Naming answers at once, because a list names every picture on it: the file is written behind it,
 * whole or not at all, and the name is known from the moment it is given, so a picture asked for
 * before its file is down is still found. A file that could not be written is tried again the next
 * time the picture is named.
 *
 * A picture kept beside a title's files on the disk is not named: it can be replaced under the same
 * address, and a name is kept by browsers for good, so it stays at the address that is checked
 * again every hour.
 *
 * @param secret - The server's secret for naming artwork.
 * @param directory - Where the names are remembered.
 * @returns How to name a picture, or nothing for one that is not named, and how to find the picture
 *   a name stands for.
 */
const createArtworkNames = (secret: string, directory: string): ArtworkNames => {
  const known = new Map<string, string>();

  return {
    nameOf: (url) => {
      if (url.startsWith(DISK_PICTURE)) {
        return null;
      }

      const name = artworkNameOf(secret, url);

      if (known.get(name) !== url) {
        const note = join(directory, name);
        const partial = `${note}.${process.pid.toString()}.part`;

        known.set(name, url);

        void mkdir(directory, { recursive: true })
          .then(() => writeFile(partial, url))
          .then(() => rename(partial, note))
          .catch(() => {
            known.delete(name);
          });
      }

      return name;
    },

    urlOf: async (name) => {
      if (!NAME.test(name)) {
        return null;
      }

      const held = known.get(name);

      if (held !== undefined) {
        return held;
      }

      const url = await readFile(join(directory, name), 'utf8').catch(() => null);

      if (url !== null && artworkNameOf(secret, url) === name) {
        known.set(name, url);

        return url;
      }

      return null;
    },
  };
};

export type { ArtworkNames };

export { createArtworkNames };
