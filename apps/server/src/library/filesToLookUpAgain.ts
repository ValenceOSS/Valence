import type { ScannedFile, StoredItem } from '@ValenceServer/library/scanLibrary';

/**
 * The unchanged files of a library worth asking the catalogue about again, so a programme it could
 * not name heals itself on a later scan instead of staying unnamed until somebody forces a rescan.
 *
 * A programme nothing in its folder was ever named for gets one of its files read again, the first
 * by path, since what one episode learns names the whole programme. A programme that was named but
 * still has episodes that were not gets those episodes read again, now straight from the programme.
 * Nothing already being read is asked for twice, and a folder with something new in it is left to
 * that.
 *
 * @param found - Every file on disk now.
 * @param stored - What the database holds about them.
 * @param changed - The files being read already.
 * @param seriesFolders - The folder each episode's programme is filed under.
 * @param catalogueBySeries - The identifier known for each programme's folder.
 * @returns The files to read again.
 */
const filesToLookUpAgain = (
  found: readonly ScannedFile[],
  stored: readonly StoredItem[],
  changed: readonly ScannedFile[],
  seriesFolders: ReadonlyMap<string, string>,
  catalogueBySeries: ReadonlyMap<string, string>,
): ScannedFile[] => {
  const storedByPath = new Map(stored.map((item) => [item.path, item]));
  const reading = new Set(changed.map((file) => file.path));
  const byFolder = new Map<string, ScannedFile[]>();

  for (const file of found) {
    const folder = seriesFolders.get(file.path);

    if (folder !== undefined) {
      byFolder.set(folder, [...(byFolder.get(folder) ?? []), file]);
    }
  }

  return [...byFolder].flatMap(([folder, files]) => {
    if (files.some((file) => reading.has(file.path))) {
      return [];
    }

    const unnamed = files
      .filter((file) => storedByPath.get(file.path)?.externalId === null)
      .toSorted((left, right) => left.path.localeCompare(right.path));

    return catalogueBySeries.has(folder) ? unnamed : unnamed.slice(0, 1);
  });
};

export { filesToLookUpAgain };
