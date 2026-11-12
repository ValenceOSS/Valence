import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { artworkNameOf } from './artworkNameOf';

const NAME = /^[0-9a-f]{32}$/u;

type ArtworkNames = {
  nameOf: (url: string) => string;
  urlOf: (name: string) => Promise<string | null>;
};

/**
 * Names pictures for serving where anybody may fetch them, and remembers which picture each name
 * stands for, in a small file beside the pictures, so a name handed out before a restart is still
 * understood after it.
 *
 * Naming answers at once, because a list names every picture on it: the file is written behind it,
 * once, and the name is known from the moment it is given, so a picture asked for before its file
 * is down is still found.
 *
 * @param secret - The server's secret for naming artwork.
 * @param directory - Where the names are remembered.
 * @returns How to name a picture, and how to find the picture a name stands for.
 */
const createArtworkNames = (secret: string, directory: string): ArtworkNames => {
  const known = new Map<string, string>();

  return {
    nameOf: (url) => {
      const name = artworkNameOf(secret, url);

      if (known.get(name) !== url) {
        known.set(name, url);

        void mkdir(directory, { recursive: true })
          .then(() => writeFile(join(directory, name), url, { flag: 'wx' }))
          .catch(() => undefined);
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
