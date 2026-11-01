import { FIRST_PANEL_PLACES } from '@ValenceSDK/manifest/FIRST_PANEL_PLACES';
import { PANEL_PLACES } from '@ValenceSDK/manifest/PANEL_PLACES';
import type { PanelPlace } from '@ValenceSDK/manifest/PanelPlace';

/**
 * The places an app can draw a plugin's panel, from what it asked for: the ones it named that
 * Valence knows, or, from an app built before it named any, the places every app has always drawn.
 *
 * @param asked - The places it named, comma separated, if it named any.
 * @returns The places to send it panels for.
 */
const placesAsked = (asked: string | undefined): ReadonlySet<PanelPlace> =>
  new Set(
    asked === undefined
      ? FIRST_PANEL_PLACES
      : asked.split(',').flatMap((named) => PANEL_PLACES.filter((place) => place === named)),
  );

export { placesAsked };
