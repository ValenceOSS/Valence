import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';

const AT_ONCE = 32;

/**
 * Measures how much disk the kept pages of books are taking, a chapter's folder at a time.
 *
 * @param directory - Where pages are kept.
 * @returns How many pages there are and how much they hold.
 */
const measureBookPages = async (directory: string): Promise<{ count: number; bytes: number }> => {
  const chapters: string[] = await readdir(directory).catch(() => []);

  const pages = (
    await mapWithLimit(chapters, AT_ONCE, async (chapter) => {
      const names: string[] = await readdir(join(directory, chapter)).catch(() => []);

      return names.map((name) => join(directory, chapter, name));
    })
  ).flat();

  const sizes = await mapWithLimit(pages, AT_ONCE, async (path) => {
    const found = await stat(path).catch(() => null);

    return found !== null && found.isFile() ? found.size : null;
  });

  return {
    count: sizes.filter((size) => size !== null).length,
    bytes: sizes.reduce((total: number, size) => total + (size ?? 0), 0),
  };
};

export { measureBookPages };
