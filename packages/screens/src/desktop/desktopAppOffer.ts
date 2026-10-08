import { desktopSystemOf } from '@ValenceClient/platform/desktopSystemOf';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { isTheDesktopClient } from '@ValenceScreens/desktop/theDesktopShell';
import { say } from '@ValenceI18n/say';
import type { DesktopSystem } from '@ValenceClient/platform/desktopSystemOf';

const SYSTEM_NAMES: Record<DesktopSystem, () => string> = {
  mac: () => say('common.mac'),
  windows: () => say('common.windows'),
  linux: () => say('common.linux'),
};

/**
 * What to call the desktop app for the computer this page is open on, where it is worth offering:
 * a browser on a Mac, a Windows PC or Linux, rather than the desktop app itself, a phone, a tablet or
 * a television.
 *
 * @returns The computer's name as the offer says it, or nothing where there is nothing to offer.
 */
const desktopAppOffer = (): string | null => {
  if (platformInUse().thisClientKind() !== 'browser' || isTheDesktopClient()) {
    return null;
  }

  const system = desktopSystemOf(navigator.userAgent, navigator.maxTouchPoints);

  return system === null ? null : SYSTEM_NAMES[system]();
};

export { desktopAppOffer };
