import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';

const SampleSchema = z.object({ url: z.string().url().nullable() });

/**
 * Where half a minute of an album can be heard before asking for it, or nothing where no sample of
 * it is offered.
 *
 * @param artist - Who it is by.
 * @param album - The album.
 * @returns Where the sample plays from, or nothing.
 */
const fetchSample = async (artist: string, album: string): Promise<string | null> =>
  (
    await readFromServer(
      `/api/requests/sample?${new URLSearchParams({ artist, album }).toString()}`,
      SampleSchema,
    )
  ).url;

export { fetchSample };
