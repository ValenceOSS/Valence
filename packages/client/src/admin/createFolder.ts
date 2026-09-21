import { z } from 'zod';
import { FolderSchema } from '@ValenceContracts/schemas/Folder';
import type { Folder } from '@ValenceContracts/schemas/Folder';

const ErrorBodySchema = z.object({ error: z.string() });

/**
 * Makes a new folder inside one on the machine running Valence, for an administrator setting up
 * where a library will live.
 *
 * @param path - The folder to make it in.
 * @param name - What to call it.
 * @returns The folder that was made.
 * @throws With the server's own words where it would not, which say what to do about it.
 */
const createFolder = async (path: string, name: string): Promise<Folder> => {
  const response = await fetch('/api/admin/folders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, name }),
  });

  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => null));

    throw new Error(parsed.success ? parsed.data.error : 'The folder could not be made.');
  }

  return FolderSchema.parse(await response.json());
};

export { createFolder };
