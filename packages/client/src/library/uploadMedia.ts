import { z } from 'zod';

const UploadedSchema = z.object({ path: z.string(), bytes: z.number().int().nonnegative() });

const ErrorBodySchema = z.object({ error: z.string() });

/**
 * Sends one file from this device into a library, as the body of a single request so that a film is
 * never held whole in memory on either end.
 *
 * @param libraryId - The library to put it in.
 * @param path - Where in the library it goes, with `/` between folders.
 * @param file - The file itself.
 * @returns Where it was put, and how much arrived.
 * @throws With the server's own words where it would not take it, which say what to change.
 */
const uploadMedia = async (
  libraryId: string,
  path: string,
  file: File,
): Promise<{ path: string; bytes: number }> => {
  const response = await fetch(
    `/api/libraries/${libraryId}/uploads?${new URLSearchParams({ path }).toString()}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: file,
    },
  );

  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => null));

    throw new Error(parsed.success ? parsed.data.error : 'The file could not be uploaded.');
  }

  return UploadedSchema.parse(await response.json());
};

export { uploadMedia };
