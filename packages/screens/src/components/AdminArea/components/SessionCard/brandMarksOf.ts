import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';
import { say } from '@ValenceI18n/say';
import { BROWSER_NAMES } from '@ValenceCore/functions/BROWSER_NAMES';

const BROWSER_MARKS: readonly { name: string; mark: BrandMarkName }[] = [
  { name: BROWSER_NAMES.opera, mark: 'opera' },
  { name: BROWSER_NAMES.brave, mark: 'brave' },
  { name: BROWSER_NAMES.chromium, mark: 'chrome' },
  { name: BROWSER_NAMES.chrome, mark: 'chrome' },
  { name: BROWSER_NAMES.firefox, mark: 'firefox' },
  { name: BROWSER_NAMES.safari, mark: 'safari' },
];

const DEVICE_MARKS: readonly { name: string; mark: BrandMarkName }[] = [
  { name: 'iPhone', mark: 'apple' },
  { name: 'iPad', mark: 'apple' },
  // oxlint-disable-next-line valence/no-hard-coded-strings -- a model name the television app reports, matched rather than shown
  { name: 'Apple TV', mark: 'apple' },
  { name: say('common.lgTV'), mark: 'lg' },
  { name: say('common.samsungTV'), mark: 'samsung' },
];

const MAKER_MARKS: Readonly<Record<string, BrandMarkName>> = {
  Hitachi: 'hitachi',
  Toshiba: 'toshiba',
};

const SYSTEM_MARKS: readonly { name: string; mark: BrandMarkName }[] = [
  { name: 'iOS', mark: 'apple' },
  { name: 'macOS', mark: 'apple' },
  { name: say('client.playback.detectClientLabel.android'), mark: 'android' },
  { name: say('common.linux'), mark: 'linux' },
  { name: say('common.windows'), mark: 'windows' },
];

/**
 * The marks of the browser and the system a session says it runs in, read from the words it is
 * labelled with, so a card can show them rather than a generic screen. A phone or a television
 * names its model rather than its system, so an iPhone, iPad or Apple TV is known by its name, and
 * an LG, Samsung, Toshiba or Hitachi television showing the TV layout in its browser by its
 * maker's. A
 * browser or system without a mark of its own — Edge, anything unrecognised — answers none, and
 * keeps its shape.
 * Chromium is shown with Chrome's mark, since it is what a browser built on Chrome that does not
 * name itself is called, and Brave with its own.
 *
 * @param deviceLabel - What the session is labelled, such as "Chromium on macOS".
 * @returns The browser's mark and the system's, each where there is one.
 */
const brandMarksOf = (
  deviceLabel: string,
): { browser: BrandMarkName | null; system: BrandMarkName | null } => ({
  browser: BROWSER_MARKS.find(({ name }) => deviceLabel.startsWith(name))?.mark ?? null,
  system:
    SYSTEM_MARKS.find(({ name }) => deviceLabel.endsWith(name))?.mark ??
    DEVICE_MARKS.find(({ name }) => deviceLabel.startsWith(name))?.mark ??
    Object.entries(MAKER_MARKS).find(
      ([maker]) => deviceLabel === say('common.makerTV', { maker }),
    )?.[1] ??
    null,
});

export { brandMarksOf };
