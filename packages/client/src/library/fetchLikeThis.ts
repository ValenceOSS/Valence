import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LikeThisSchema } from '@ValenceContracts/schemas/Likeness';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Reads the films and programmes in the libraries most like one, a programme by its first episode.
 *
 * @param mediaId - The film, or any episode of the programme.
 * @returns The titles, most alike first.
 */
const fetchLikeThis = async (mediaId: string): Promise<MediaSummary[]> =>
  (await readFromServer(`/api/media/${encodeURIComponent(mediaId)}/like-this`, LikeThisSchema))
    .items;

export { fetchLikeThis };
