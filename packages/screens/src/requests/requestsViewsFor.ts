import { REQUESTS_VIEWS } from '@ValenceScreens/requests/REQUESTS_VIEWS';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The Requests views there is something to ask for in: Movies where a library takes films, Shows
 * where one takes series, Music where one takes artists or albums, Books where one takes books,
 * and Discover and your own requests always.
 *
 * @param kinds - The kinds that can be asked for.
 * @returns The views, in their order.
 */
const requestsViewsFor = (kinds: ReadonlySet<MediaRequestKind>) =>
  REQUESTS_VIEWS.filter((view) => {
    switch (view.id) {
      case 'film:popular':
        return kinds.has('film');
      case 'series:popular':
        return kinds.has('series');
      case 'music':
        return kinds.has('artist') || kinds.has('album');
      case 'books':
        return kinds.has('book');
      case 'discover':
      case 'mine':
        return true;
    }
  });

export { requestsViewsFor };
