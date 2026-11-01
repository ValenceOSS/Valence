import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';
import type { DeviceSystem } from '@ValenceContracts/schemas/DeviceIdentity';
import { whichTv } from '@ValenceTv/native/whichTv';
import { theTvsOwnName } from '@ValenceTv/platform/theTvsOwnName';
import type { TvKind } from '@ValenceTv/platform/TvKind';

const OUR_APPS: Readonly<Partial<Record<TvKind, DeviceSystem>>> = {
  appleTv: 'tvos',
  androidTv: 'androidTv',
  fireTv: 'fireOs',
};

/**
 * What this television tells the server about itself: on an Apple TV, an Android TV or a Fire TV,
 * that it is Valence's own app, which of those it is and the name its owner gave it; in a
 * television's own browser, only that it is a browser, since that browser's user agent already says
 * whose television it is.
 *
 * @param kind - Which television this is.
 * @param name - What its owner named it, where the system says.
 * @returns What to tell the server.
 */
const hintsAboutThisTv = (
  kind: TvKind = whichTv(),
  name: string | null = theTvsOwnName(),
): DeviceHints => {
  const system = OUR_APPS[kind];

  if (system === undefined) {
    return { app: 'browser' };
  }

  return { app: 'tv', system, form: 'tv', ...(name === null ? {} : { name }) };
};

export { hintsAboutThisTv };
