import { STREAMED_PREFIX } from './STREAMED_PREFIX';

/**
 * Which film a path names, where it is a streamed film's rather than a file's.
 *
 * @param path - The path.
 * @returns The film's id in the catalogue, or null where the path is a file's.
 */
const readStreamedPath = (path: string): number | null => {
  if (!path.startsWith(STREAMED_PREFIX)) {
    return null;
  }

  const id = path.slice(STREAMED_PREFIX.length);

  return /^[1-9]\d{0,9}$/.test(id) ? Number(id) : null;
};

export { readStreamedPath };
