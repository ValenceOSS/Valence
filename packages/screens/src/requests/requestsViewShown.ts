import { readBrowsing } from '@ValenceScreens/requests/readBrowsing';

/**
 * Which of the Requests views an address is showing, so that arriving at trending films from the
 * shelf that leads there still reads as being under Movies rather than nowhere.
 *
 * @param requestsView - The view the address names, or null for Discover.
 * @returns The id of the view to mark as chosen.
 */
const requestsViewShown = (requestsView: string | null): string => {
  const browsing = readBrowsing(requestsView);

  if (browsing !== null) {
    return browsing.kind === 'film' ? 'film:popular' : 'series:popular';
  }

  return requestsView === 'mine' || requestsView === 'music' || requestsView === 'books'
    ? requestsView
    : 'discover';
};

export { requestsViewShown };
