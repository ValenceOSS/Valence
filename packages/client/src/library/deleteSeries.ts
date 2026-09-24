import { z } from 'zod';

const ErrorBodySchema = z.object({ error: z.string() });

const DeletedSeriesSchema = z.object({ files: z.number().int().nonnegative() });

/**
 * Deletes every episode of a series from its library's disk, with what was kept beside each, and
 * has Valence forget the series. It cannot be undone.
 *
 * @param seriesId - The series whose files go.
 * @returns How many files went.
 * @throws With the server's own words where it would not, which say what to change.
 */
const deleteSeries = async (seriesId: string): Promise<number> => {
  const response = await fetch(`/api/series/${seriesId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => null));

    throw new Error(parsed.success ? parsed.data.error : 'The series could not be deleted.');
  }

  return DeletedSeriesSchema.parse(await response.json()).files;
};

export { deleteSeries };
