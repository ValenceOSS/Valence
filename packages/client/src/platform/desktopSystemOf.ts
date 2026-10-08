import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';

type DesktopSystem = 'mac' | 'windows' | 'linux';

/**
 * Which computer a browser is on, where it is one the desktop app is made for: a Mac, a Windows PC
 * or Linux, and not a phone, a tablet, a television or a Chromebook. An iPad says it is a Mac and is
 * told apart by its touch screen.
 *
 * @param userAgent - What the browser says it is.
 * @param touchPoints - How many fingers its screen takes, nought for none.
 * @returns The system, or nothing where the desktop app is not for it.
 */
const desktopSystemOf = (userAgent: string, touchPoints = 0): DesktopSystem | null => {
  if (tvBrowserOf(userAgent) !== null || /Android|iPhone|iPad|iPod|CrOS|Mobile/u.test(userAgent)) {
    return null;
  }

  if (/Macintosh|Mac OS X/u.test(userAgent)) {
    return touchPoints > 1 ? null : 'mac';
  }

  if (/Windows/u.test(userAgent)) {
    return 'windows';
  }

  return /Linux|X11/u.test(userAgent) ? 'linux' : null;
};

export type { DesktopSystem };

export { desktopSystemOf };
