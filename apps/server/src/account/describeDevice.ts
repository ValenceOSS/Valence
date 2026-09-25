import { say } from '@ValenceI18n/say';

const BROWSERS = [
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Edge', marks: ['Edg/'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Opera', marks: ['OPR/', 'Opera'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Firefox', marks: ['Firefox/'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Chrome', marks: ['Chrome/', 'Chromium/'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Safari', marks: ['Safari/'] },
] as const;

const SYSTEMS = [
  { named: 'iPhone', marks: ['iPhone'] },
  { named: 'iPad', marks: ['iPad'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Android', marks: ['Android'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'macOS', marks: ['Macintosh', 'Mac OS X'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
  { named: 'Windows', marks: ['Windows'] },
  // eslint-disable-next-line valence/no-hard-coded-strings -- a brand name and the marks it is known by
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
    return say('server.describeDevice.app', { device: app });
  }

  const browser = BROWSERS.find((candidate) =>
    candidate.marks.some((mark) => said.includes(mark)),
  )?.named;

  const system = SYSTEMS.find((candidate) =>
    candidate.marks.some((mark) => said.includes(mark)),
  )?.named;

  if (said.includes('Electron/')) {
    return system === undefined
      ? say('server.describeDevice.desktop')
      : say('server.describeDevice.desktopOn', { system });
  }

  if (said.startsWith('Valence/') && said.includes('CFNetwork/')) {
    return say('server.describeDevice.apple');
  }

  if (said.startsWith('okhttp/')) {
    return say('server.describeDevice.android');
  }

  if (browser === undefined && system === undefined) {
    return said.trim() === '' ? say('server.defaults.unknownDevice') : said.slice(0, KEPT);
  }

  if (browser === undefined) {
    return system ?? say('server.defaults.unknownDevice');
  }

  return system === undefined
    ? browser
    : say('server.describeDevice.browserOn', { browser, system });
};

export { describeDevice };
