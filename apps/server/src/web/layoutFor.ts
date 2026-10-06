import { isATvBrowser } from '@ValenceServer/web/isATvBrowser';

/**
 * Which layout a browser is shown: what somebody chose, where they chose, and otherwise the TV
 * layout for a television's own browser and the web app for every other.
 *
 * @param userAgent - What the browser says it is.
 * @param chosen - The layout somebody chose on this browser, from its cookie.
 * @returns The layout.
 */
const layoutFor = (userAgent: string | undefined, chosen: string | undefined): 'tv' | 'web' => {
  if (chosen === 'tv' || chosen === 'web') {
    return chosen;
  }

  return isATvBrowser(userAgent) ? 'tv' : 'web';
};

export { layoutFor };
