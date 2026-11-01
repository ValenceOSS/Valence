import type { InAppBrowser } from '@ValenceContracts/schemas/DeviceIdentity';

/* oxlint-disable valence/no-hard-coded-strings -- the marks apps' own browsers add to their user agents, matched rather than shown */
const MARKED: readonly { app: InAppBrowser; pattern: RegExp }[] = [
  { app: 'messenger', pattern: /FBAN\/Messenger|FB_IAB\/MESSENGER|\bMessengerFor/u },
  { app: 'facebook', pattern: /FBAN\/|FBAV\/|FB_IAB\//u },
  { app: 'instagram', pattern: /\bInstagram\b/u },
  { app: 'whatsapp', pattern: /\bWAiOS\/|\bWA4A\/|\bWhatsApp\b/u },
  { app: 'tiktok', pattern: /\bmusical_ly|\bBytedanceWebview\b|\bTikTok\b/u },
  { app: 'snapchat', pattern: /\bSnapchat\b/u },
  { app: 'linkedin', pattern: /\bLinkedInApp\b/u },
  { app: 'line', pattern: /\bLine\/\d/u },
  { app: 'pinterest', pattern: /\bPinterest\b/u },
];
/* oxlint-enable valence/no-hard-coded-strings */

const APPLE_MOBILE = /\biPhone\b|\biPad\b|\biPod\b/u;

const WEBKIT = /\bAppleWebKit\b/u;

const SAFARI = /\bSafari\//u;

const ANDROID_WEB_VIEW = /;\s*wv\)/u;

/**
 * Which app's own browser a page is open in, when somebody followed a link inside an app rather than
 * in a browser of their own: by the mark the app adds, or as an unnamed one where the browser can
 * only be an app's. On an iPhone every real browser keeps Safari's mark, so a WebKit user agent
 * without it is always a view inside some app; on Android an app's view says so with "wv".
 *
 * @param userAgent - What the browser says it is.
 * @returns The app, unnamed where it does not say which, or nothing for a browser of its own.
 */
const inAppBrowserOf = (userAgent: string): InAppBrowser | null => {
  const marked = MARKED.find(({ pattern }) => pattern.test(userAgent));

  if (marked !== undefined) {
    return marked.app;
  }

  const isAppleViewWithoutSafari =
    APPLE_MOBILE.test(userAgent) && WEBKIT.test(userAgent) && !SAFARI.test(userAgent);

  return isAppleViewWithoutSafari || ANDROID_WEB_VIEW.test(userAgent) ? 'unnamed' : null;
};

export { inAppBrowserOf };
