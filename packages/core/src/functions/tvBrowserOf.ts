import type { TvBrowser } from '@ValenceCore/functions/TvBrowser';

const LG = /\b(?:Web0S|webOS|NetCast)\b/i;

const SAMSUNG = /\bTizen\b/i;

const XBOX = /\bXbox\b/i;

const ANOTHER_TELEVISION =
  /\b(?:SMART-TV|SmartTV|SmartTvA|VIDAA|TitanOS|NETTV|WhaleTV|HbbTV)\b|\bOMI\//i;

/**
 * Whose television a browser belongs to, read from what it says it is: LG's, which call themselves
 * webOS, Samsung's, which call themselves Tizen, an Xbox's, whose Edge names the console, or another
 * maker's: Hisense's and Toshiba's VIDAA, the Titan OS on Philips and JVC sets, the Vewd browser on
 * Vestel-made sets, or any that says it is a smart TV or carries the HbbTV every European set does.
 * LG's say "SmartTV" too, so they are asked about first.
 *
 * @param userAgent - What the browser says it is.
 * @returns Whose television it is, or nothing for a browser that is not a television's.
 */
const tvBrowserOf = (userAgent: string): TvBrowser | null => {
  if (LG.test(userAgent)) {
    return 'lgTv';
  }

  if (SAMSUNG.test(userAgent)) {
    return 'samsungTv';
  }

  if (XBOX.test(userAgent)) {
    return 'xbox';
  }

  return ANOTHER_TELEVISION.test(userAgent) ? 'smartTv' : null;
};

export { tvBrowserOf };
