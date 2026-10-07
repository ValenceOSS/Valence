import { LAYOUT_COOKIE } from '@ValenceCore/functions/LAYOUT_COOKIE';
import { LAYOUT_COOKIE_SECONDS } from '@ValenceCore/functions/LAYOUT_COOKIE_SECONDS';
import type { Layout } from '@ValenceCore/functions/Layout';

/**
 * Has this browser shown a layout from now on, whatever it is, and shows it straight away: the TV
 * layout on a television's browser, or the web app's. The server reads the choice from a cookie, so
 * it holds across every address, and it is kept for a year, since a television is rarely signed out
 * of and nobody should have to choose twice.
 *
 * @param layout - The layout to show.
 * @param page - The browser's document.
 */
const chooseTheLayout = (
  layout: Layout,
  page: { cookie: string; location: { reload: () => void } },
): void => {
  page.cookie = `${LAYOUT_COOKIE}=${layout}; path=/; max-age=${LAYOUT_COOKIE_SECONDS}; samesite=lax`;
  page.location.reload();
};

export { chooseTheLayout };
