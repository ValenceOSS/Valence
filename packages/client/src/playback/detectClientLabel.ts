import { say } from '@ValenceI18n/say';

type Match = { name: string; pattern: RegExp };

const BROWSERS: Match[] = [
  { name: say('common.edge'), pattern: /Edg\// },
  { name: say('common.opera'), pattern: /OPR\// },
  { name: say('common.chromium'), pattern: /Chrome\// },
  { name: say('common.firefox'), pattern: /Firefox\// },
  { name: say('client.playback.detectClientLabel.safari'), pattern: /Safari\// },
];

const OPERATING_SYSTEMS: Match[] = [
  { name: 'iOS', pattern: /iPhone|iPad|iPod/ },
  { name: say('client.playback.detectClientLabel.android'), pattern: /Android/ },
  { name: 'macOS', pattern: /Mac OS X/ },
  { name: say('common.windows'), pattern: /Windows/ },
  { name: say('common.linux'), pattern: /Linux/ },
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
    BROWSERS.find((candidate) => candidate.pattern.test(userAgent))?.name ?? say('common.browser');
  const os = OPERATING_SYSTEMS.find((candidate) => candidate.pattern.test(userAgent))?.name ?? null;

  return os === null
    ? browser
    : say('client.playback.detectClientLabel.browserOnOs', { browser, os });
};

export { detectClientLabel };
