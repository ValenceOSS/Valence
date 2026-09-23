import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestAsk, ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

/**
 * What to ask for a title as it stands: a film as it is, a series with the seasons chosen, an
 * artist with the kinds of release chosen, an album as it is, a book by its Open Library number.
 *
 * @param title - The title.
 * @param seasons - The seasons chosen, for a series.
 * @param releaseTypes - The kinds of release chosen, for an artist.
 * @returns What to ask for.
 */
const askingFor = (
  title: CatalogueTitleDetail,
  seasons: number[] | null,
  releaseTypes: ReleaseType[],
): MediaRequestAsk =>
  isBookRequest(title.kind)
    ? { kind: title.kind, openLibraryId: Number(title.id) }
    : isMusicRequest(title.kind)
      ? {
          kind: title.kind,
          musicBrainzId: title.musicBrainzId ?? title.id,
          ...(title.kind === 'artist' ? { releaseTypes } : {}),
        }
      : {
          kind: title.kind,
          tmdbId: Number(title.id),
          ...(title.kind === 'series' ? { seasons } : {}),
        };

export { askingFor };
