import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PreRollChoiceSchema } from '@ValenceContracts/schemas/PreRoll';
import type { PreRollChoice } from '@ValenceContracts/schemas/PreRoll';

/**
 * Asks which clip, if any, plays before a film or episode. A server that cannot say, such as one
 * older than pre-roll, is taken as having none, so the title is never held up waiting.
 *
 * @param mediaId - The film or episode.
 * @returns The clip to play first, or nothing.
 */
const fetchPreRoll = async (mediaId: string): Promise<PreRollChoice['clip']> =>
  (
    await readFromServer(`/api/media/${mediaId}/pre-roll`, PreRollChoiceSchema).catch(() => ({
      clip: null,
    }))
  ).clip;

export { fetchPreRoll };
