import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
/* eslint-disable valence/no-hard-coded-strings -- browsers' and systems' own names, and the marks their user agents carry */
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
/* eslint-enable valence/no-hard-coded-strings */

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
const describeDevice = (userAgent: string | null | undefined): Said => {
  const said = userAgent ?? '';
  const app = OUR_APP.exec(said)?.groups?.['device'];

  if (app !== undefined) {
    return saying('server.account.device.valenceOn', { device: app });
  }

  const browser = BROWSERS.find((candidate) =>
    candidate.marks.some((mark) => said.includes(mark)),
  )?.named;

  const system = SYSTEMS.find((candidate) =>
    candidate.marks.some((mark) => said.includes(mark)),
  )?.named;

  if (said.includes('Electron/')) {
    return system === undefined
      ? saying('server.account.device.desktopApp')
      : saying('server.account.device.desktopAppOn', { system });
  }

  if (said.startsWith('Valence/') && said.includes('CFNetwork/')) {
    return saying('server.account.device.appleDevice');
  }

  if (said.startsWith('okhttp/')) {
    return saying('server.account.device.android');
  }

  if (browser === undefined && system === undefined) {
    return said.trim() === ''
      ? saying('server.realtime.realtimeHandler.unknownDevice')
      : sayVerbatim(said.slice(0, KEPT));
  }

  if (browser === undefined) {
    return system === undefined
      ? saying('server.realtime.realtimeHandler.unknownDevice')
      : sayVerbatim(system);
  }

  return system === undefined
    ? sayVerbatim(browser)
    : saying('server.account.device.browserOn', { browser, system });
};

export { describeDevice };
