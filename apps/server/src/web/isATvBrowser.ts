const TELEVISION = /\b(?:Web0S|webOS|Tizen|SMART-TV|SmartTV|NetCast)\b/i;

const CHROMIUM = /\bChrome\/(\d+)/;

const OLDEST_CHROMIUM = 84;

/**
 * Whether a browser is a television's own, new enough to run the TV layout: LG's and Samsung's,
 * on a Chromium from 84 on, the first to lay out with gaps between items, which the TV layout uses
 * everywhere. An older television's browser is treated as any other browser.
 *
 * @param userAgent - What the browser says it is.
 * @returns Whether it should be shown the TV layout.
 */
const isATvBrowser = (userAgent: string | undefined): boolean => {
  if (userAgent === undefined || !TELEVISION.test(userAgent)) {
    return false;
  }

  const version = CHROMIUM.exec(userAgent)?.[1];

  return version !== undefined && Number(version) >= OLDEST_CHROMIUM;
};

export { isATvBrowser };
