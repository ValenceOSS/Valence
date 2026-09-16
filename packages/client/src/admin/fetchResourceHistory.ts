import { readFromServer } from '@ValenceClient/query/readFromServer';
import { ResourceSampleHistorySchema } from '@ValenceContracts/schemas/ResourceSample';
import type {
  ResourceSampleRange,
  ResourceSampleRecord,
} from '@ValenceContracts/schemas/ResourceSample';

/**
 * Reads a range of the server's load history, so the load card can show more than the last minute it
 * has been open for.
 *
 * @param range - How far back to read.
 * @returns The samples across that range, oldest first.
 */
const fetchResourceHistory = async (
  range: ResourceSampleRange,
): Promise<ResourceSampleRecord[]> => {
  const parameters = new URLSearchParams({ range });

  return (
    await readFromServer(
      `/api/admin/monitor/history?${parameters.toString()}`,
      ResourceSampleHistorySchema,
    )
  ).records;
};

export { fetchResourceHistory };
