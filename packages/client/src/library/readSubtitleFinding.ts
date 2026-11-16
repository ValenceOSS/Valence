import { readFromServer } from '@ValenceClient/query/readFromServer';
import { SubtitleFindingSchema } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleFinding } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * Asks whether subtitles can be found for a film or episode: on which sites and in which languages
 * first, as the server that holds its file searches, or why they cannot.
 *
 * @param mediaId - The film or episode.
 * @returns Whether they can, and how.
 */
const readSubtitleFinding = (mediaId: string): Promise<SubtitleFinding> =>
  readFromServer(
    // oxlint-disable-next-line valence/no-hard-coded-strings -- an address on the server, not words anyone reads
    `/api/media/${mediaId}/subtitles/finding`,
    SubtitleFindingSchema,
  );

export { readSubtitleFinding };
