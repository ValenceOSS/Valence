import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';

/**
 * Keeps the files of a download its client is fetching, leaving out any it was told to skip. A
 * client that made every file whole first leaves a skipped one as nothing but zeros, which is not
 * a piece that went missing. The client names each file from the torrent's own folder down, so a
 * file on disk is matched by how its path ends.
 *
 * @param files - The files found on disk.
 * @param wanted - The names of the files the client is fetching, or nothing where it would not say.
 * @returns The files that are meant to be whole.
 */
const onlyWanted = (
  files: readonly DownloadedFile[],
  wanted: readonly string[] | null,
): DownloadedFile[] => {
  if (wanted === null) {
    return [...files];
  }

  const names = wanted.map((name) => name.replaceAll('\\', '/'));

  return files.filter((file) => {
    const path = file.path.replaceAll('\\', '/');

    return names.some((name) => path === name || path.endsWith(`/${name}`));
  });
};

export { onlyWanted };
