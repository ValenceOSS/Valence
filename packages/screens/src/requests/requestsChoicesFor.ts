import { REQUESTS_VIEWS } from '@ValenceScreens/requests/REQUESTS_VIEWS';
import { requestsViewShown } from '@ValenceScreens/requests/requestsViewShown';
import type { NavBarChoices } from '@ValenceUI/NavBar.types';

/**
 * The choice between the Requests views — Discover, Movies, Shows, Music, Books and your own
 * requests — offered from the bar, so the page itself needs no row of tabs.
 *
 * @param requestsView - The view the address names, or null for Discover.
 * @param onSelect - Told the view chosen, or null for Discover.
 * @returns The choice.
 */
const requestsChoicesFor = (
  requestsView: string | null,
  onSelect: (requestsView: string | null) => void,
): NavBarChoices => ({
  label: 'What to discover',
  options: REQUESTS_VIEWS,
  selectedId: requestsViewShown(requestsView),
  onSelect: (id: string) => {
    onSelect(id === 'discover' ? null : id);
  },
});

export { requestsChoicesFor };
