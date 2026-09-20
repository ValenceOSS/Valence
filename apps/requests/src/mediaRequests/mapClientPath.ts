import { join } from 'node:path';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';

/**
 * Where a download client's file is as this service sees it, where the two see the downloads
 * folder by different names — as two containers mounting it at different places do. A path outside
 * the client's folder, or a client with no folder set, is taken as it is.
 *
 * @param path - The path as the client gave it.
 * @param client - The client, with its folder and the same folder here.
 * @returns The path here.
 */
const mapClientPath = (
  path: string,
  { remotePath, localPath }: Pick<DownloadClientRecord, 'remotePath' | 'localPath'>,
): string => {
  if (remotePath === '' || localPath === '') {
    return path;
  }

  const prefix = remotePath.endsWith('/') ? remotePath : `${remotePath}/`;

  if (path === remotePath) {
    return localPath;
  }

  return path.startsWith(prefix) ? join(localPath, path.slice(prefix.length)) : path;
};

export { mapClientPath };
