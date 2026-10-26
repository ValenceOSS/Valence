import { useQuery } from '@tanstack/react-query';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const NOTHING_ALIKE: readonly MediaSummary[] = [];

/**
 * Finds the films and programmes in the libraries most like a title, asking only a server that can
 * say.
 *
 * @param mediaId - The film, or any episode of the programme, or null where there is none.
 * @returns The titles, most alike first, a programme by its first episode; none until they arrive.
 */
const useLikeThis = (mediaId: string | null): readonly MediaSummary[] => {
  const canSay = useServerHas('library.likeness') === true;
  const alike = useQuery(libraryQueries.likeThis(mediaId, canSay));

  return alike.data ?? NOTHING_ALIKE;
};

export { useLikeThis };
