const BROWSERS = [
  { named: 'Edge', marks: ['Edg/'] },
  { named: 'Opera', marks: ['OPR/', 'Opera'] },
  { named: 'Firefox', marks: ['Firefox/'] },
  { named: 'Chrome', marks: ['Chrome/', 'Chromium/'] },
  { named: 'Safari', marks: ['Safari/'] },
] as const;

const SYSTEMS = [
  { named: 'iPhone', marks: ['iPhone'] },
  { named: 'iPad', marks: ['iPad'] },
  { named: 'Android', marks: ['Android'] },
  { named: 'macOS', marks: ['Macintosh', 'Mac OS X'] },
  { named: 'Windows', marks: ['Windows'] },
  { named: 'Linux', marks: ['Linux', 'X11'] },
] as const;

const KEPT = 40;

const OUR_APP = /^Valence \((?<device>[^)]+)\)/u;

/**
 * Names a device from what its browser said about itself, for the list of sessions an account can
 * review and end. A user agent nobody recognises is described as an unknown device rather than
 * printed raw, which would be a line of noise nobody can act on.
 *
 * Valence's own apps are named as themselves: the phone and the television say which device they are
 * on, the desktop app is a browser underneath and is told apart by the runtime it carries, and an app
 * from before they said so is at least named as Valence rather than as its networking library.
 *
 * @param userAgent - What the browser sent, if it sent anything.
 * @returns The browser and system, as a person would say them.
 */
const describeDevice = (userAgent: string | null | undefined): string => {
  const said = userAgent ?? '';
  const app = OUR_APP.exec(said)?.groups?.['device'];

  if (app !== undefined) {
    return `Valence on ${app}`;
  }

  const browser = BROWSERS.find((candidate) =>
    candidate.marks.some((mark) => said.includes(mark)),
  )?.named;

  const system = SYSTEMS.find((candidate) =>
    candidate.marks.some((mark) => said.includes(mark)),
  )?.named;

  if (said.includes('Electron/')) {
    return system === undefined ? 'Valence desktop app' : `Valence desktop app on ${system}`;
  }

  if (said.startsWith('Valence/') && said.includes('CFNetwork/')) {
    return 'Valence on an Apple device';
  }

  if (said.startsWith('okhttp/')) {
    return 'Valence on Android';
  }

  if (browser === undefined && system === undefined) {
    return said.trim() === '' ? 'Unknown device' : said.slice(0, KEPT);
  }

  if (browser === undefined) {
    return system ?? 'Unknown device';
  }

  return system === undefined ? browser : `${browser} on ${system}`;
};

export { describeDevice };
