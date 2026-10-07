import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';
import { say } from '@ValenceI18n/say';

const BROWSER_MARKS: readonly { name: string; mark: BrandMarkName }[] = [
  { name: say('common.opera'), mark: 'opera' },
  { name: say('common.chromium'), mark: 'chrome' },
  { name: say('screens.sessionCard.deviceIcon.chrome'), mark: 'chrome' },
  { name: say('common.firefox'), mark: 'firefox' },
  { name: say('client.playback.detectClientLabel.safari'), mark: 'safari' },
];

const DEVICE_MARKS: readonly { name: string; mark: BrandMarkName }[] = [
  { name: 'iPhone', mark: 'apple' },
  { name: 'iPad', mark: 'apple' },
  // oxlint-disable-next-line valence/no-hard-coded-strings -- a model name the television app reports, matched rather than shown
  { name: 'Apple TV', mark: 'apple' },
  { name: say('common.lgTV'), mark: 'lg' },
  { name: say('common.samsungTV'), mark: 'samsung' },
];

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
 * an LG or Samsung television showing the TV layout in its browser by its maker's. A
 * browser or system without a mark of its own — Edge, anything unrecognised — answers none, and
 * keeps its shape.
 * Chromium is shown as Chrome, since a browser built on it names itself the same way and Chrome is
 * the one that almost always is.
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
    null,
});

export { brandMarksOf };
