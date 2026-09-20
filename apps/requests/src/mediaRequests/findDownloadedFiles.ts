import { readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

type DownloadedFile = { path: string; name: string; sizeBytes: number };

const DEEPEST = 5;

/**
 * Every file a download left, whether it is one file or a folder of them, a few folders deep.
 *
 * @param root - Where the download is.
 * @returns Its files.
 */
const findDownloadedFiles = async (root: string): Promise<DownloadedFile[]> => {
  const found = await stat(root);

  if (found.isFile()) {
    return [{ path: root, name: basename(root), sizeBytes: found.size }];
  }

  const walk = async (folder: string, depth: number): Promise<DownloadedFile[]> => {
    const entries = await readdir(folder, { withFileTypes: true });
    const within = await Promise.all(
      entries.map(async (entry): Promise<DownloadedFile[]> => {
        const path = join(folder, entry.name);

        if (entry.isDirectory()) {
          return depth < DEEPEST ? walk(path, depth + 1) : [];
        }

        return entry.isFile()
          ? [{ path, name: entry.name, sizeBytes: (await stat(path)).size }]
          : [];
      }),
    );

    return within.flat();
  };

  return walk(root, 1);
};

export type { DownloadedFile };

export { findDownloadedFiles };
