import { ChangedEntrySchema } from '@ValenceContracts/schemas/LibraryFiles';
import { changeOnServer } from '@ValenceClient/query/changeOnServer';

/**
 * Changes something inside a library from the file manager — deletes it, renames it where it is,
 * or moves it into another folder — and says where it is now. The library it was in is scanned
 * afterwards, so the catalogue follows.
 *
 * @param path - The file or folder.
 * @param change - What to do with it.
 * @returns Where it is now, which for a deletion is where it was.
 * @throws With the server's own words where it would not, which say what to change.
 */
const changeLibraryFile = async (
  path: string,
  change: { kind: 'delete' } | { kind: 'rename'; name: string } | { kind: 'move'; into: string },
): Promise<string> => {
  const answer =
    change.kind === 'delete'
      ? await changeOnServer(
          `/api/admin/files?${new URLSearchParams({ path }).toString()}`,
          { method: 'DELETE' },
          'That could not be deleted.',
        )
      : change.kind === 'rename'
        ? await changeOnServer(
            '/api/admin/files/rename',
            { method: 'POST', json: { path, name: change.name } },
            'That could not be renamed.',
          )
        : await changeOnServer(
            '/api/admin/files/move',
            { method: 'POST', json: { path, into: change.into } },
            'That could not be moved.',
          );

  return ChangedEntrySchema.parse(answer).path;
};

export { changeLibraryFile };
