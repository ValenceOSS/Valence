import type { MediaOrigin } from '@ValenceContracts/schemas/MediaOrigin';
import type { EntryDescription, ListedEntry } from '@ValenceServer/files/describeLibraryEntries';

/**
 * Adds to what a listing says of each entry where each file Valence holds came from, and whether
 * it is linked to a download now. Folders and files Valence does not hold are left as they were.
 *
 * @param describe - Says what each entry is to its library.
 * @param readOrigins - Says where each of some files came from.
 * @returns What says both.
 */
const withOrigins =
  (
    describe: (entries: readonly ListedEntry[]) => Promise<Record<string, EntryDescription>>,
    readOrigins: (paths: readonly string[]) => Promise<Record<string, MediaOrigin>>,
  ) =>
  async (entries: readonly ListedEntry[]): Promise<Record<string, EntryDescription>> => {
    const described = await describe(entries);
    const held = entries
      .filter((entry) => !entry.isFolder && (described[entry.path]?.mediaId ?? null) !== null)
      .map((entry) => entry.path);
    const origins = await readOrigins(held);

    return Object.fromEntries(
      Object.entries(described).map(([path, description]) => {
        const origin = origins[path];

        return [path, origin === undefined ? description : { ...description, origin }];
      }),
    );
  };

export { withOrigins };
