import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { extname, isAbsolute, join } from 'node:path';
import type { PreRollClip } from '@ValenceContracts/schemas/PreRoll';

const PLAYABLE_EVERYWHERE = new Set(['.mp4', '.m4v', '.mov']);

type PreRollClipOnDisk = PreRollClip & { path: string };

/**
 * Reads the clips in the pre-roll folder: the films in it that every Valence player plays as they
 * are, named from the file, each with an identifier made from its name so it is the same from one
 * look to the next and says nothing about where the folder is.
 *
 * Only MP4 and QuickTime files count, since a clip is sent untouched to a browser, a phone and a
 * television alike, and those are what all three play without the server converting anything.
 *
 * @param folder - The folder, as a whole path on the server.
 * @returns The clips in name order, or nothing where the folder cannot be read.
 */
const listPreRollClips = async (folder: string): Promise<PreRollClipOnDisk[] | null> => {
  if (folder.trim() === '' || !isAbsolute(folder)) {
    return null;
  }

  const entries = await readdir(folder, { withFileTypes: true }).catch(() => null);

  if (entries === null) {
    return null;
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith('.') &&
        PLAYABLE_EVERYWHERE.has(extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort((one, other) => one.localeCompare(other))
    .map((name) => ({
      id: createHash('sha256').update(name).digest('hex').slice(0, 16),
      name: name.slice(0, name.length - extname(name).length),
      path: join(folder, name),
    }));
};

export type { PreRollClipOnDisk };

export { listPreRollClips };
