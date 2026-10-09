import { readFromServer } from '@ValenceClient/query/readFromServer';
import { FoundSubtitlesSchema } from '@ValenceContracts/schemas/SubtitleFinding';
import type { FoundSubtitles } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * Looks for subtitles in one language for a film or episode, on the sites Valence has keys for.
 *
 * @param mediaId - The film or episode.
 * @param language - The language, as a two-letter code.
 * @returns What was found, those timed to this very file first.
 */
const findSubtitles = (mediaId: string, language: string): Promise<FoundSubtitles> =>
  readFromServer(
    // oxlint-disable-next-line valence/no-hard-coded-strings -- an address on the server, not words anyone reads
    `/api/media/${mediaId}/subtitles/found?${new URLSearchParams({ language }).toString()}`,
    FoundSubtitlesSchema,
  );

export { findSubtitles };
