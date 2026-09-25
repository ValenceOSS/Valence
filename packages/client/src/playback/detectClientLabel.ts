import { say } from '@ValenceI18n/say';

type Match = { name: string; pattern: RegExp };

const BROWSERS: Match[] = [
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Edge', pattern: /Edg\// },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Opera', pattern: /OPR\// },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Chromium', pattern: /Chrome\// },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Firefox', pattern: /Firefox\// },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Safari', pattern: /Safari\// },
];

const OPERATING_SYSTEMS: Match[] = [
  { name: 'iOS', pattern: /iPhone|iPad|iPod/ },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Android', pattern: /Android/ },
  { name: 'macOS', pattern: /Mac OS X/ },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Windows', pattern: /Windows/ },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a product name, printed as it is sold in every language
  { name: 'Linux', pattern: /Linux/ },
];

/**
 * Names what a viewer is watching from — "Chrome on macOS" rather than a generic "Browser" — for the
 * sessions an operator sees and the devices an account can review. Built from the user agent, in the
 * shape other media servers use, so an operator reading it recognises what they are looking at.
 *
 * @param userAgent - What the browser says about itself.
 * @returns The device as a person would describe it.
 */
const detectClientLabel = (userAgent: string): string => {
  const browser =
    BROWSERS.find((candidate) => candidate.pattern.test(userAgent))?.name ??
    say('client.detectClientLabel.browser');
  const os = OPERATING_SYSTEMS.find((candidate) => candidate.pattern.test(userAgent))?.name ?? null;

  return os === null ? browser : say('client.detectClientLabel.browserOn', { browser, os });
};

export { detectClientLabel };
