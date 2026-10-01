import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PreTranscodingStatusSchema } from '@ValenceContracts/schemas/PreTranscoding';
import type { PreTranscodingStatus } from '@ValenceContracts/schemas/PreTranscoding';

/**
 * Reads the pre-transcoding settings, and how far it has got.
 *
 * @returns The settings, the copies made and still needed, and the one under way.
 */
const fetchPreTranscoding = async (): Promise<PreTranscodingStatus> =>
  readFromServer('/api/pre-transcoding', PreTranscodingStatusSchema);

export { fetchPreTranscoding };
