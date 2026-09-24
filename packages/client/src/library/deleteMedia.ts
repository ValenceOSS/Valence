import { z } from 'zod';

const ErrorBodySchema = z.object({ error: z.string() });

/**
 * Deletes one file from its library's disk, with what was kept beside it, and has Valence forget
 * it. It cannot be undone.
 *
 * @param mediaId - The item whose file goes.
 * @throws With the server's own words where it would not, which say what to change.
 */
const deleteMedia = async (mediaId: string): Promise<void> => {
  const response = await fetch(`/api/media/${mediaId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => null));

    throw new Error(parsed.success ? parsed.data.error : 'The file could not be deleted.');
  }
};

export { deleteMedia };
