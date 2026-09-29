import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { pageInTheLibrary } from './pageInTheLibrary';
import type { QueryClient } from '@tanstack/react-query';
import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';
import type { APage } from './SignedIn.types';

/**
 * The page to open for something somebody wants to ask about: its own page in the library where it is
 * already known to be there, so the page that would ask for it is never opened only to be swapped
 * away mid-slide, or the page that asks for it otherwise.
 *
 * @param cache - What has already been read, and nothing more; this never waits on the network.
 * @param about - What kind of thing it is.
 * @param id - The id it was listed under.
 * @returns The page to open.
 */
const pageToAskAbout = (cache: QueryClient, about: CatalogueBrowseKind, id: string): APage => {
  const standing = cache.getQueryData(requestsQueries.askable(about, id).queryKey)?.standing;

  return standing?.status === 'library' && standing.mediaId !== null
    ? pageInTheLibrary(about, standing.mediaId)
    : { kind: 'asking', about, id };
};

export { pageToAskAbout };
