import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';

const AT_ONCE = 32;

/**
 * Measures how much disk the cached artwork is taking. Each poster is kept beside a small file saying
 * what kind of picture it is, which is counted in the bytes but not as a picture of its own.
 *
 * @param directory - The artwork cache.
 * @returns How many pictures there are and how much they hold.
 */
const measureArtwork = async (directory: string): Promise<{ count: number; bytes: number }> => {
  const names: string[] = await readdir(directory).catch(() => []);

  const sizes = await mapWithLimit(names, AT_ONCE, async (name) => {
    const found = await stat(join(directory, name)).catch(() => null);

    return found !== null && found.isFile() ? found.size : null;
  });

  return {
    count: names.filter((name, at) => sizes[at] !== null && !name.endsWith('.type')).length,
    bytes: sizes.reduce((total: number, size) => total + (size ?? 0), 0),
  };
};

export { measureArtwork };
