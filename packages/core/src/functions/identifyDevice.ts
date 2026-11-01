import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';
import { DeviceWordsSchema } from '@ValenceContracts/schemas/DeviceIdentity';
import type {
  DeviceApp,
  DeviceForm,
  DeviceIdentity,
  DeviceSystem,
} from '@ValenceContracts/schemas/DeviceIdentity';
import { browserOf } from '@ValenceCore/functions/browserOf';
import { inAppBrowserOf } from '@ValenceCore/functions/inAppBrowserOf';
import { systemOf } from '@ValenceCore/functions/systemOf';
import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';
import type { TvBrowser } from '@ValenceCore/functions/TvBrowser';
import { tvMakerOf } from '@ValenceCore/functions/tvMakerOf';

type DeviceAsked = {
  userAgent: string | null | undefined;
  brands?: readonly string[];
  kind?: ClientKind | null;
  hints?: DeviceHints;
};

const OUR_APP = /^Valence \((?<device>[^)]+)\)/u;

/* oxlint-disable valence/no-hard-coded-strings -- what older Valence apps wrote into their user agents, and the names a system gives every device of a kind, matched rather than shown */
const ON_ANDROID = / on Android$/u;

const NAMES_EVERY_DEVICE_HAS = new Set(['iPhone', 'iPad', 'iPod touch', 'Apple TV']);

const ELECTRON = 'Electron/';

const APPLE_NETWORKING = 'CFNetwork/';

const ANDROID_NETWORKING = 'okhttp/';

const OUR_NETWORKING = 'Valence/';
/* oxlint-enable valence/no-hard-coded-strings */

const TELEVISIONS: Readonly<Record<TvBrowser, { system: DeviceSystem | null; form: DeviceForm }>> =
  {
    lgTv: { system: 'webos', form: 'tv' },
    samsungTv: { system: 'tizen', form: 'tv' },
    xbox: { system: 'xbox', form: 'console' },
    smartTv: { system: null, form: 'tv' },
  };

const FORM_OF_SYSTEM: Readonly<Partial<Record<DeviceSystem, DeviceForm>>> = {
  ios: 'phone',
  ipados: 'tablet',
  macos: 'computer',
  windows: 'computer',
  linux: 'computer',
  chromeos: 'computer',
  tvos: 'tv',
  androidTv: 'tv',
  fireOs: 'tv',
  webos: 'tv',
  tizen: 'tv',
  xbox: 'console',
};

const TELEVISION_OF_SYSTEM: Readonly<Record<DeviceSystem, DeviceSystem | null>> = {
  ios: 'tvos',
  ipados: 'tvos',
  tvos: 'tvos',
  android: 'androidTv',
  androidTv: 'androidTv',
  fireOs: 'fireOs',
  macos: null,
  windows: null,
  linux: null,
  chromeos: null,
  webos: 'webos',
  tizen: 'tizen',
  xbox: 'xbox',
};

const FORM_OF_APP: Readonly<Partial<Record<DeviceApp, DeviceForm>>> = {
  phone: 'phone',
  tv: 'tv',
  desktop: 'computer',
};

/**
 * Which of Valence's clients is asking, from what it says it is and, for an app too old to say, the
 * marks its user agent carries.
 *
 * @param kind - What kind of client it said it is, where it said.
 * @param userAgent - What it sent as its user agent.
 * @param isOurApp - Whether that user agent is the one Valence's own apps write.
 * @returns The client.
 */
const appOf = (kind: ClientKind | null, userAgent: string, isOurApp: boolean): DeviceApp => {
  if (kind === 'phone' || kind === 'tv' || kind === 'desktop') {
    return kind;
  }

  if (userAgent.includes(ELECTRON)) {
    return 'desktop';
  }

  return isOurApp ||
    userAgent.startsWith(OUR_NETWORKING) ||
    userAgent.startsWith(ANDROID_NETWORKING)
    ? 'phone'
    : 'browser';
};

/**
 * Which system one of Valence's own apps runs on, where it is too old to say: an Android phone named
 * itself as on Android, and each system's networking library leaves its own mark.
 *
 * @param userAgent - What the app sent as its user agent.
 * @param ourName - What the app called itself in it, where it did.
 * @param seen - What the user agent's own marks say.
 * @returns The system, where anything says.
 */
const systemOfAnOlderApp = (
  userAgent: string,
  ourName: string | undefined,
  seen: { system: DeviceSystem | null } | null,
): DeviceSystem | null => {
  if (
    (ourName !== undefined && ON_ANDROID.test(ourName)) ||
    userAgent.startsWith(ANDROID_NETWORKING)
  ) {
    return 'android';
  }

  if (userAgent.includes(APPLE_NETWORKING)) {
    return 'ios';
  }

  return seen?.system ?? null;
};

/**
 * What a device is and what it is reaching Valence through, from everything it said about itself:
 * what its client says it knows — its own name, its model, the system a page can tell that its user
 * agent hides — believed first, and its user agent, the brands its client hints name and the kind of
 * client it said it is read for the rest. A client that says nothing is described from its user agent
 * alone, as every client was before any said more.
 *
 * A name the system gives every device of a kind, such as the "iPhone" an iPhone reports in place of
 * the name its owner chose, is no name at all, and neither is one that only repeats the model.
 *
 * @param asked - What the device sent.
 * @returns The device and its client.
 */
const identifyDevice = ({
  userAgent,
  brands = [],
  kind = null,
  hints = {},
}: DeviceAsked): DeviceIdentity => {
  const said = userAgent ?? '';
  const ourName = OUR_APP.exec(said)?.groups?.['device']?.trim();
  const television = tvBrowserOf(said);
  const seen = television === null ? systemOf(said) : TELEVISIONS[television];
  const app =
    hints.app ?? (television === null ? appOf(kind, said, ourName !== undefined) : 'browser');
  const isOurNativeApp = app === 'phone' || (app === 'tv' && television === null);
  const olderAppsSystem = isOurNativeApp ? systemOfAnOlderApp(said, ourName, seen) : null;
  const system =
    hints.system ??
    (app === 'tv' && olderAppsSystem !== null
      ? TELEVISION_OF_SYSTEM[olderAppsSystem]
      : isOurNativeApp
        ? olderAppsSystem
        : (seen?.system ?? null));
  const seenForm = isOurNativeApp ? undefined : seen?.form;
  const form =
    hints.form ??
    (system === null ? undefined : FORM_OF_SYSTEM[system]) ??
    seenForm ??
    FORM_OF_APP[app] ??
    null;
  const inApp = app === 'browser' ? inAppBrowserOf(said) : null;
  const isBrowsing = (app === 'browser' || app === 'webApp') && inApp === null;
  const model = hints.model ?? null;
  const named = DeviceWordsSchema.safeParse((hints.name ?? ourName)?.replace(ON_ANDROID, ''));
  const name =
    named.success && !NAMES_EVERY_DEVICE_HAS.has(named.data) && named.data !== model
      ? named.data
      : null;

  return {
    app,
    system,
    form,
    browser: isBrowsing ? (hints.browser ?? browserOf(said, brands)) : null,
    inApp,
    maker: television === 'smartTv' ? tvMakerOf(said) : null,
    model,
    name,
  };
};

export type { DeviceAsked };

export { identifyDevice };
