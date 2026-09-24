import { z } from 'zod';
import { changeOnServer } from '@ValenceClient/query/changeOnServer';

const DeletedSeriesSchema = z.object({ files: z.number().int().nonnegative() });

/**
 * Deletes every episode of a series from its library's disk, with what was kept beside each, and
 * has Valence forget the series. It cannot be undone.
 *
 * @param seriesId - The series whose files go.
 * @returns How many files went.
 * @throws With the server's own words where it would not, which say what to change.
 */
const deleteSeries = async (seriesId: string): Promise<number> =>
  DeletedSeriesSchema.parse(
    await changeOnServer(
      `/api/series/${seriesId}`,
      { method: 'DELETE' },
      'The series could not be deleted.',
    ),
  ).files;

export { deleteSeries };
