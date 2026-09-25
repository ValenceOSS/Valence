import {
  Cast as CastIcon,
  Compass as CompassIcon,
  Globe as GlobeIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { IconGlyph } from '@ValenceUI/Icon.types';

// eslint-disable-next-line valence/no-hard-coded-strings -- browser names matched against a device label, not words shown
const BROWSERS = ['Edge', 'Opera', 'Chromium', 'Chrome', 'Firefox'] as const;

/**
 * Picks the icon for a device, so a list of sessions can be read by shape as well as by name.
 *
 * What kind of thing it is comes from the client itself rather than from what it calls itself. A
 * phone is usually named after whoever owns it, and reading "Dan's iPhone" for the word iPhone gets
 * it right until somebody calls their laptop that. A client that says nothing is taken for a
 * browser, which is what every client was before any of them said.
 *
 * Within a browser the label is still worth reading: the icon set carries no brand marks, so the
 * distinction it can draw honestly is something browsing against something in the corner of a
 * room. The browser's own name is written beside it either way.
 *
 * @param deviceLabel - What the session calls the device.
 * @param clientKind - What kind of client said so.
 * @returns The icon to draw.
 */
const deviceIconFor = (deviceLabel: string, clientKind: ClientKind = 'browser'): IconGlyph => {
  if (clientKind === 'phone') {
    return SmartphoneIcon;
  }

  if (clientKind === 'tv') {
    return CastIcon;
  }

  if (clientKind === 'desktop') {
    return MonitorIcon;
  }

  if (deviceLabel.startsWith('Safari')) {
    return CompassIcon;
  }

  return BROWSERS.some((name) => deviceLabel.startsWith(name)) ? GlobeIcon : MonitorIcon;
};

export { deviceIconFor };
