import { say } from '@ValenceI18n/say';
import { browserOf } from '@ValenceCore/functions/browserOf';
import { BROWSER_NAMES } from '@ValenceCore/functions/BROWSER_NAMES';

type Match = { name: string; pattern: RegExp };

const OPERATING_SYSTEMS: Match[] = [
  { name: 'iOS', pattern: /iPhone|iPad|iPod/ },
  { name: say('client.playback.detectClientLabel.android'), pattern: /Android/ },
  { name: 'macOS', pattern: /Mac OS X/ },
  { name: say('common.windows'), pattern: /Windows/ },
  { name: say('common.linux'), pattern: /Linux/ },
];

/**
 * Names what a viewer is watching from — "Chrome on macOS" rather than a generic "Browser" — for the
 * sessions an operator sees and the devices an account can review. Built from the user agent and
 * the brands the browser names in its client hints, in the shape other media servers use, so an
 * operator reading it recognises what they are looking at.
 *
 * @param userAgent - What the browser says about itself.
 * @param brands - The brands its client hints name, where it gave any.
 * @returns The device as a person would describe it.
 */
const detectClientLabel = (userAgent: string, brands: readonly string[] = []): string => {
  const known = browserOf(userAgent, brands);
  const browser = known === null ? say('common.browser') : BROWSER_NAMES[known];
  const os = OPERATING_SYSTEMS.find((candidate) => candidate.pattern.test(userAgent))?.name ?? null;

  return os === null
    ? browser
    : say('client.playback.detectClientLabel.browserOnOs', { browser, os });
};

export { detectClientLabel };
