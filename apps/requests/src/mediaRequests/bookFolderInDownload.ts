import { basename, dirname } from 'node:path';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';

const DISC = /^(cd|dis[ck]|part)\s*\d+$/i;

/**
 * The folder a file's book is in, taking a disc's folder as part of the book around it.
 *
 * @param file - The file.
 * @returns The book's folder.
 */
const bookFolderInDownload = (file: DownloadedFile): string => {
  let folder = dirname(file.path);

  while (DISC.test(basename(folder))) {
    folder = dirname(folder);
  }

  return folder;
};

export { bookFolderInDownload };
