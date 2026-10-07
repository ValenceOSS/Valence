import { chromiumOf } from '@ValenceCore/functions/chromiumOf';
import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';

const OLDEST_CHROMIUM = 111;

/**
 * Whether a browser can run the web app, which is built for Chromium 111 and later. A television's
 * browser usually cannot: LG's are Chromium 87 to 108 until 2025, and the web app shows them a
 * white page. Any other browser is taken to be current, since it updates itself.
 *
 * @param userAgent - What the browser says it is.
 * @returns Whether the web app runs on it.
 */
const runsTheWebApp = (userAgent: string): boolean =>
  tvBrowserOf(userAgent) === null || (chromiumOf(userAgent) ?? 0) >= OLDEST_CHROMIUM;

export { runsTheWebApp };
