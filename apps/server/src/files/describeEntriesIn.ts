import { libraryOf } from '@ValenceServer/files/libraryOf';
import { describeLibraryEntries } from '@ValenceServer/files/describeLibraryEntries';
import type { Library } from '@ValenceContracts/schemas/Library';
import type {
  EntryDescription,
  EntryFacts,
  ListedEntry,
} from '@ValenceServer/files/describeLibraryEntries';

/**
 * Says of files and folders listed from any of the libraries what each is to its library, asking
 * each library once for what it holds of them.
 *
 * @param libraries - The libraries.
 * @param entries - What was listed.
 * @param readFacts - Reads what one library holds of some files and folders.
 * @returns Each entry's description, by its path; one outside every library is left out.
 */
const describeEntriesIn = async (
  libraries: readonly Library[],
  entries: readonly ListedEntry[],
  readFacts: (
    libraryId: string,
    files: readonly string[],
    folders: readonly string[],
  ) => Promise<EntryFacts>,
): Promise<Record<string, EntryDescription>> => {
  const byLibrary = new Map<string, { library: Library; entries: ListedEntry[] }>();

  for (const entry of entries) {
    const library = libraryOf(libraries, entry.path);

    if (library !== null) {
      const held = byLibrary.get(library.id) ?? { library, entries: [] };

      held.entries.push(entry);
      byLibrary.set(library.id, held);
    }
  }

  const described = await Promise.all(
    [...byLibrary.values()].map(async ({ library, entries: listed }) =>
      describeLibraryEntries(
        listed,
        library,
        await readFacts(
          library.id,
          listed.filter((one) => !one.isFolder).map((one) => one.path),
          listed.filter((one) => one.isFolder).map((one) => one.path),
        ),
      ),
    ),
  );

  return Object.fromEntries(described.flatMap((one) => Object.entries(one)));
};

export { describeEntriesIn };
