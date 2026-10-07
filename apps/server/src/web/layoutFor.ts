import type { Layout } from '@ValenceCore/functions/Layout';
import { runsTheWebApp } from '@ValenceCore/functions/runsTheWebApp';
import { isATvBrowser } from '@ValenceServer/web/isATvBrowser';

/**
 * Which layout a browser is shown: what somebody chose, where they chose, and otherwise the TV
 * layout for a television's own browser and the web app for every other. The web app is not shown
 * to a television that cannot run it, whatever was chosen: it would show a white page, and the way
 * back to the TV layout is a button inside the web app, so whoever chose it could never get back.
 *
 * @param userAgent - What the browser says it is.
 * @param chosen - The layout somebody chose on this browser, from its cookie.
 * @returns The layout.
 */
const layoutFor = (userAgent: string | undefined, chosen: string | undefined): Layout => {
  if (chosen === 'tv' || (chosen === 'web' && runsTheWebApp(userAgent ?? ''))) {
    return chosen;
  }

  return isATvBrowser(userAgent) ? 'tv' : 'web';
};

export { layoutFor };
