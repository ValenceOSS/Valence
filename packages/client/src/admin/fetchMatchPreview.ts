import { readFromServer } from '@ValenceClient/query/readFromServer';
import { MatchPreviewSchema } from '@ValenceContracts/schemas/TitleEdit';
import type { MatchPreview } from '@ValenceContracts/schemas/TitleEdit';

/**
 * Compares a title, field by field, with the catalogue entry it is about to be matched to.
 *
 * @param mediaId - A file of the title.
 * @param externalId - The entry's catalogue number.
 * @param kind - Whether the entry is a film or a programme.
 * @returns Each field the entry fills, as it stands and as it would be.
 */
const fetchMatchPreview = (
  mediaId: string,
  externalId: string,
  kind: 'tv' | 'movie',
): Promise<MatchPreview> => {
  const query = `?${new URLSearchParams({ externalId, kind }).toString()}`;

  return readFromServer(`/api/media/${mediaId}/match/preview${query}`, MatchPreviewSchema);
};

export { fetchMatchPreview };
