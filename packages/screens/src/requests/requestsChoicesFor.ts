import { requestsViewsFor } from '@ValenceScreens/requests/requestsViewsFor';
import { requestsViewShown } from '@ValenceScreens/requests/requestsViewShown';
import type { NavBarChoices } from '@ValenceUI/NavBar.types';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

/**
 * The choice between the Requests views — Discover, Movies, Shows, Music, Books and your own
 * requests — offered from the bar, so the page itself needs no row of tabs. A kind no library takes
 * requests for has no view.
 *
 * @param requestsView - The view the address names, or null for Discover.
 * @param onSelect - Told the view chosen, or null for Discover.
 * @param kinds - The kinds that can be asked for.
 * @returns The choice.
 */
const requestsChoicesFor = (
  requestsView: string | null,
  onSelect: (requestsView: string | null) => void,
  kinds: ReadonlySet<MediaRequestKind>,
): NavBarChoices => ({
  label: say('screens.requests.requestsChoicesFor.whatToDiscover'),
  options: requestsViewsFor(kinds),
  selectedId: requestsViewShown(requestsView),
  onSelect: (id: string) => {
    onSelect(id === 'discover' ? null : id);
  },
});

export { requestsChoicesFor };
