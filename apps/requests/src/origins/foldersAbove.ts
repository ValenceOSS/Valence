import { dirname } from 'node:path';

const MOST_LEVELS = 6;

/**
 * Every folder a file sits in, nearest first, a few levels up, which is as far as a book or an
 * album filed as a folder can be from one of its files.
 *
 * @param path - The file.
 * @returns The folders above it.
 */
const foldersAbove = (path: string): string[] => {
  const folders: string[] = [];
  let at = path;

  while (folders.length < MOST_LEVELS) {
    const up = dirname(at);

    if (up === at) {
      break;
    }

    folders.push(up);
    at = up;
  }

  return folders;
};

export { foldersAbove };
