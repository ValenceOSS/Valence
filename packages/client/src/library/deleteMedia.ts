import { changeOnServer } from '@ValenceClient/query/changeOnServer';

/**
 * Deletes one file from its library's disk, with what was kept beside it, and has Valence forget
 * it. It cannot be undone.
 *
 * @param mediaId - The item whose file goes.
 * @throws With the server's own words where it would not, which say what to change.
 */
const deleteMedia = async (mediaId: string): Promise<void> => {
  await changeOnServer(
    `/api/media/${mediaId}`,
    { method: 'DELETE' },
    'The file could not be deleted.',
  );
};

export { deleteMedia };
