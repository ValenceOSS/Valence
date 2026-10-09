import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type {
  BookFormat,
  MediaRequestAsk,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';

/**
 * What to ask for a title as it stands: a film as it is, a series with the seasons chosen and
 * whether new ones are followed, an artist with the kinds of release chosen, an album as it is, a
 * book by its Open Library number in the formats chosen.
 *
 * @param title - The title.
 * @param seasons - The seasons chosen, for a series.
 * @param releaseTypes - The kinds of release chosen, for an artist.
 * @param followsNewSeasons - Whether seasons that air later are fetched too, for a series.
 * @param bookFormats - The formats chosen, for a book.
 * @returns What to ask for.
 */
const askingFor = (
  title: CatalogueTitleDetail,
  seasons: number[] | null,
  releaseTypes: ReleaseType[],
  followsNewSeasons = true,
  bookFormats: readonly BookFormat[] = ['ebook'],
): MediaRequestAsk =>
  isBookRequest(title.kind)
    ? { kind: title.kind, openLibraryId: Number(title.id), bookFormats: [...bookFormats] }
    : isMusicRequest(title.kind)
      ? {
          kind: title.kind,
          musicBrainzId: title.musicBrainzId ?? title.id,
          ...(title.kind === 'artist' ? { releaseTypes } : {}),
        }
      : {
          kind: title.kind,
          tmdbId: Number(title.id),
          ...(title.kind === 'series' ? { seasons, followsNewSeasons } : {}),
        };

export { askingFor };
