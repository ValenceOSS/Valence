import { chromiumOf } from '@ValenceCore/functions/chromiumOf';
import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';

const OLDEST_CHROMIUM = 84;

/**
 * Whether a browser is a television's own, new enough to run the TV layout: LG's, Samsung's, an
 * Xbox's or another maker's, on a Chromium from 84 on, the first to lay out with gaps between
 * items, which the TV layout uses everywhere. An older television's browser is treated as any other
 * browser.
 *
 * @param userAgent - What the browser says it is.
 * @returns Whether it should be shown the TV layout.
 */
const isATvBrowser = (userAgent: string | undefined): boolean => {
  if (userAgent === undefined || tvBrowserOf(userAgent) === null) {
    return false;
  }

  return (chromiumOf(userAgent) ?? 0) >= OLDEST_CHROMIUM;
};

export { isATvBrowser };
