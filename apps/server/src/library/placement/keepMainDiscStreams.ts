import { discFolderOf } from '@ValenceServer/library/naming/discFolderOf';

/**
 * Keeps one stream of each Blu-ray rip copied whole, its largest, which is the film rather than its
 * menus, trailers and extras, and every other file as it is.
 *
 * @param files - The files found, each with its size.
 * @returns Them, with every stream but the largest of each disc left out.
 */
const keepMainDiscStreams = <File extends { path: string; sizeBytes: number }>(
  files: readonly File[],
): File[] => {
  const largest = new Map<string, File>();

  for (const file of files) {
    const disc = discFolderOf(file.path);
    const held = disc === null ? undefined : largest.get(disc);

    if (
      disc !== null &&
      (held === undefined ||
        file.sizeBytes > held.sizeBytes ||
        (file.sizeBytes === held.sizeBytes && file.path < held.path))
    ) {
      largest.set(disc, file);
    }
  }

  return files.filter((file) => {
    const disc = discFolderOf(file.path);

    return disc === null || largest.get(disc) === file;
  });
};

export { keepMainDiscStreams };
