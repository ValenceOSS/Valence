import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';

const CHROMIUM = /\bChrome\/(\d+)|\b(\d+)(?:\.\d+){3,4}\/[\d.]+ TV\b/;

const OLDEST_CHROMIUM = 84;

/**
 * Whether a browser is a television's own, new enough to run the TV layout: LG's, Samsung's or an
 * Xbox's, on a Chromium from 84 on, the first to lay out with gaps between items, which the TV
 * layout uses everywhere. An older television's browser is treated as any other browser. Samsung's
 * gives its Chromium's version without naming Chromium, as "85.0.4183.93/6.5 TV", so that is read
 * too.
 *
 * @param userAgent - What the browser says it is.
 * @returns Whether it should be shown the TV layout.
 */
const isATvBrowser = (userAgent: string | undefined): boolean => {
  if (userAgent === undefined || tvBrowserOf(userAgent) === null) {
    return false;
  }

  const found = CHROMIUM.exec(userAgent);
  const version = found?.[1] ?? found?.[2];

  return version !== undefined && Number(version) >= OLDEST_CHROMIUM;
};

export { isATvBrowser };
