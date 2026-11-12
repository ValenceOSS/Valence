import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { artworkNameOf } from './artworkNameOf';

const NAME = /^[0-9a-f]{32}$/u;

type ArtworkNames = {
  nameOf: (url: string) => Promise<string>;
  urlOf: (name: string) => Promise<string | null>;
};

/**
 * Names pictures for serving where anybody may fetch them, and remembers which picture each name
 * stands for, in a small file beside the pictures, so a name handed out before a restart is still
 * understood after it.
 *
 * @param secret - The server's secret for naming artwork.
 * @param directory - Where the names are remembered.
 * @returns How to name a picture, and how to find the picture a name stands for.
 */
const createArtworkNames = (secret: string, directory: string): ArtworkNames => {
  const known = new Map<string, string>();

  return {
    nameOf: async (url) => {
      const name = artworkNameOf(secret, url);

      if (known.get(name) !== url) {
        await mkdir(directory, { recursive: true });
        await writeFile(join(directory, name), url);
        known.set(name, url);
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
