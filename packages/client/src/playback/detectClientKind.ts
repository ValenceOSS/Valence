import type { ClientKind } from '@ValenceClient/platform/Platform.types';

const TELEVISIONS: RegExp[] = [
  /Tizen/,
  /Web0S|WebOS|webOS/,
  /SMART-TV|SmartTV|Smart[ _-]?TV/,
  /HbbTV/,
  /NetCast/,
  /AFT[A-Z]/,
  /CrKey|Chromecast/,
  /GoogleTV|Google TV/,
  /AppleTV|Apple TV/,
  /BRAVIA|Viera|AQUOS|Philips[ _]?TV/,
  /Roku/,
  /DTV\b/,
  /Large Screen/,
  /\bTV\b/,
];

/**
 * Says whether a user agent belongs to a television, so a screen that asks somebody to type can
 * offer them their phone instead.
 *
 * Kept beside detectClientLabel rather than inside it, because the two answer different questions:
 * that one names a device for somebody reading a list of sessions, and this one decides what a
 * screen does. A television that is named wrongly is a cosmetic fault; one that is treated as a
 * keyboard is a dead end.
 *
 * @param userAgent - What the client says about itself.
 * @returns Which kind of client this is.
 */
const detectClientKind = (userAgent: string): ClientKind =>
  TELEVISIONS.some((pattern) => pattern.test(userAgent)) ? 'tv' : 'browser';

export { detectClientKind };
