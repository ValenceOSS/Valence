import type {
  DeviceIdentity,
  DeviceSystem,
  InAppBrowser,
} from '@ValenceContracts/schemas/DeviceIdentity';
import { BROWSER_NAMES } from '@ValenceCore/functions/BROWSER_NAMES';
import { nameTheSystem } from '@ValenceCore/functions/nameTheSystem';
import type { Said } from '@ValenceI18n/SaidSchema';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

/* oxlint-disable valence/no-hard-coded-strings -- apps' own product names, which are not translated */
const APP_NAMES: Readonly<Record<Exclude<InAppBrowser, 'unnamed'>, string>> = {
  facebook: 'Facebook',
  messenger: 'Messenger',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
  line: 'LINE',
  pinterest: 'Pinterest',
};
/* oxlint-enable valence/no-hard-coded-strings */

const TELEVISION_BROWSERS: ReadonlySet<DeviceSystem> = new Set(['webos', 'tizen']);

/**
 * The name one of Valence's own apps is made for: the television it runs on rather than the system
 * underneath it, since nobody calls an Apple TV app a tvOS one.
 *
 * @param system - The system the app runs on.
 * @returns What the app is for.
 */
const madeFor = (system: DeviceSystem): string => {
  if (system === 'tvos') {
    return say('common.appleTV');
  }

  return system === 'fireOs' ? say('common.fireTV') : nameTheSystem(system);
};

/**
 * What a browser is called: by the app it lives inside where it is an app's own, by its own name
 * where it is one this knows, and as unknown where it is neither.
 *
 * @param identity - What the device is.
 * @param system - The name of the system it runs on, where it is known.
 * @returns The browser's name.
 */
const nameTheBrowser = (identity: DeviceIdentity, system: string | null): Said => {
  if (identity.inApp === 'unnamed') {
    return system === null
      ? saying('core.nameTheClient.inAppBrowser')
      : saying('core.nameTheClient.inAppBrowserOn', { system });
  }

  if (identity.inApp !== null) {
    const app = APP_NAMES[identity.inApp];

    return system === null
      ? saying('core.nameTheClient.appsInAppBrowser', { app })
      : saying('core.nameTheClient.appsInAppBrowserOn', { app, system });
  }

  if (identity.browser === null) {
    return system === null
      ? saying('core.nameTheClient.unknownBrowser')
      : saying('core.nameTheClient.unknownBrowserOn', { system });
  }

  const browser = BROWSER_NAMES[identity.browser];

  return system === null
    ? sayVerbatim(browser)
    : saying('core.nameTheClient.browserOn', { browser, system });
};

/**
 * What a device is reaching Valence through, said under its name: one of Valence's own apps by the
 * system it is made for, Valence opened from a home screen as the web app, a television's browser as
 * that, and any other browser by its name and the system it runs on.
 *
 * @param identity - What the device is.
 * @returns What it reaches Valence through.
 */
const nameTheClient = (identity: DeviceIdentity): Said => {
  const isTelevisionBrowser =
    (identity.system !== null && TELEVISION_BROWSERS.has(identity.system)) ||
    (identity.system === null && identity.form === 'tv' && identity.app !== 'tv');

  if (isTelevisionBrowser) {
    return saying('core.nameTheClient.tvBrowser');
  }

  if (identity.app === 'phone' || identity.app === 'tv' || identity.app === 'desktop') {
    return identity.system === null
      ? saying('core.nameTheClient.theValenceApp')
      : saying('common.valenceForSystem', { system: madeFor(identity.system) });
  }

  const system = identity.system === null ? null : nameTheSystem(identity.system);

  if (identity.app === 'webApp') {
    return system === null
      ? saying('core.nameTheClient.valenceWebApp')
      : saying('core.nameTheClient.valenceWebAppOn', { system });
  }

  return nameTheBrowser(identity, system);
};

export { nameTheClient };
