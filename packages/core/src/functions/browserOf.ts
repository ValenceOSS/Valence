import type { Browser } from '@ValenceCore/functions/Browser';

/* oxlint-disable valence/no-hard-coded-strings -- the marks browsers' user agents and brand hints carry, matched rather than shown */
const MARKED: readonly { browser: Browser; marks: readonly string[]; brands: readonly string[] }[] =
  [
    { browser: 'edge', marks: ['Edg/', 'EdgA/', 'EdgiOS/'], brands: ['Microsoft Edge'] },
    { browser: 'opera', marks: ['OPR/', 'Opera'], brands: ['Opera', 'Opera GX'] },
    { browser: 'samsungInternet', marks: ['SamsungBrowser/'], brands: ['Samsung Internet'] },
    { browser: 'yandex', marks: ['YaBrowser/'], brands: ['Yandex'] },
    { browser: 'vivaldi', marks: ['Vivaldi/'], brands: ['Vivaldi'] },
    { browser: 'brave', marks: [], brands: ['Brave'] },
    { browser: 'firefox', marks: ['Firefox/', 'FxiOS/'], brands: [] },
    { browser: 'chrome', marks: ['CriOS/'], brands: ['Google Chrome'] },
  ];

const CHROMIUM_MARKS = ['Chrome/', 'Chromium/'];

const SAFARI_MARK = 'Safari/';
/* oxlint-enable valence/no-hard-coded-strings */

/**
 * Which browser something is, from its user agent and the brands it names in its client hints.
 *
 * Browsers built on Chromium send Chrome's user agent word for word, so the brands are what tell
 * them apart: Chrome names "Google Chrome", Edge and Brave name themselves, and a browser that names
 * nothing but Chromium — Arc among them — is called Chromium rather than assumed to be Chrome. A
 * browser only sends its brands over HTTPS or to localhost, so without them a Chromium browser is
 * Chromium too.
 *
 * @param userAgent - What the browser says it is.
 * @param brands - The brands its client hints name, where it sent any.
 * @returns The browser, or nothing where it is none this knows.
 */
const browserOf = (userAgent: string, brands: readonly string[] = []): Browser | null => {
  const marked = MARKED.find(
    (candidate) =>
      candidate.marks.some((mark) => userAgent.includes(mark)) ||
      candidate.brands.some((brand) => brands.includes(brand)),
  );

  if (marked !== undefined) {
    return marked.browser;
  }

  if (CHROMIUM_MARKS.some((mark) => userAgent.includes(mark))) {
    return 'chromium';
  }

  return userAgent.includes(SAFARI_MARK) ? 'safari' : null;
};

export { browserOf };
