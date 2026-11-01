import {
  Gamepad as GamepadIcon,
  Globe as GlobeIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/fill';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type {
  DeviceForm,
  DeviceIdentity,
  DeviceSystem,
} from '@ValenceContracts/schemas/DeviceIdentity';
import type { Browser } from '@ValenceContracts/schemas/Browser';
import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type DeviceMarks = {
  deviceGlyph: IconGlyph;
  systemMark: BrandMarkName | null;
  clientGlyph: IconGlyph;
  clientMark: BrandMarkName | null;
};

const GLYPH_OF_FORM: Readonly<Record<DeviceForm, IconGlyph>> = {
  phone: SmartphoneIcon,
  tablet: TabletIcon,
  computer: MonitorIcon,
  tv: TvIcon,
  console: GamepadIcon,
};

const GLYPH_OF_KIND: Readonly<Record<ClientKind, IconGlyph>> = {
  phone: SmartphoneIcon,
  tv: TvIcon,
  desktop: MonitorIcon,
  browser: GlobeIcon,
};

const MARK_OF_SYSTEM: Readonly<Partial<Record<DeviceSystem, BrandMarkName>>> = {
  ios: 'apple',
  ipados: 'apple',
  macos: 'apple',
  tvos: 'apple',
  android: 'android',
  androidTv: 'android',
  windows: 'windows',
  linux: 'linux',
  webos: 'lg',
  tizen: 'samsung',
};

const MARK_OF_MAKER: Readonly<Record<string, BrandMarkName>> = {
  hitachi: 'hitachi',
  toshiba: 'toshiba',
};

const WORDMARKS: ReadonlySet<BrandMarkName> = new Set(['lg', 'samsung', 'toshiba', 'hitachi']);

const MARK_OF_BROWSER: Readonly<Partial<Record<Browser, BrandMarkName>>> = {
  chrome: 'chrome',
  chromium: 'chrome',
  firefox: 'firefox',
  safari: 'safari',
  opera: 'opera',
  brave: 'brave',
  vivaldi: 'vivaldi',
};

/**
 * What to draw for a device and for what it reaches Valence through, so a list of them can be read
 * by shape as well as by name: the device by its system's mark where it has one and by its shape
 * where it does not, and the client by Valence's own mark for Valence's apps, by the browser's mark
 * for a browser that has one, and by a globe for any other browser. Chromium is drawn with Chrome's
 * mark, since that is what a browser built on Chrome that does not name itself is.
 *
 * A device too old to have said what it is is drawn by the kind of client it said it was.
 *
 * @param identity - What the device is, where it is known.
 * @param kind - What kind of client it said it was.
 * @returns What to draw.
 */
const marksOfDevice = (
  identity: DeviceIdentity | null,
  kind: ClientKind = 'browser',
): DeviceMarks => {
  if (identity === null) {
    return {
      deviceGlyph: GLYPH_OF_KIND[kind],
      systemMark: null,
      clientGlyph: GLYPH_OF_KIND[kind],
      clientMark: kind === 'browser' ? null : 'valence',
    };
  }

  const isOurs = identity.app !== 'browser';
  const isTelevisionBrowser = !isOurs && identity.form === 'tv';

  return {
    deviceGlyph: identity.form === null ? GLYPH_OF_KIND[kind] : GLYPH_OF_FORM[identity.form],
    systemMark:
      (identity.system === null ? undefined : MARK_OF_SYSTEM[identity.system]) ??
      (identity.maker === null ? undefined : MARK_OF_MAKER[identity.maker.toLowerCase()]) ??
      null,
    clientGlyph: isTelevisionBrowser ? TvIcon : GlobeIcon,
    clientMark: isOurs
      ? 'valence'
      : identity.browser === null || identity.inApp !== null
        ? null
        : (MARK_OF_BROWSER[identity.browser] ?? null),
  };
};

export type { DeviceMarks };

export { WORDMARKS, marksOfDevice };
