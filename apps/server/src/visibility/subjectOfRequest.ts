type Subject =
  { kind: 'item'; mediaId: string } | { kind: 'series'; seriesId: string } | { kind: 'none' };

const ID = '[0-9a-fA-F-]{36}';

const ITEM_ROUTES: readonly RegExp[] = [
  new RegExp(`^/api/media/(${ID})(/.*)?$`),
  new RegExp(`^/api/playback/(${ID})(/.*)?$`),
  new RegExp(`^/api/music/tracks/(${ID})(/.*)?$`),
];

const SERIES_ROUTES: readonly RegExp[] = [new RegExp(`^/api/series/(${ID})(/.*)?$`)];

/**
 * Which item or programme, if any, a request is about, read from its address alone.
 *
 * This is matched by prefix rather than against a list of known routes, and the difference matters.
 * The share gate names every route a guest may reach and refuses the rest, so a route it has never
 * heard of is closed and forgetting one is safe. This is the opposite: it decides what to *refuse*,
 * so a route it has never heard of is open, and forgetting one is a leak. Matching everything under
 * an item's address means a route added next month is covered the day it is written rather than the
 * day somebody remembers.
 *
 * An identifier is matched by shape, which is what keeps `/api/playback/session/...` and
 * `/api/playback/trickplay/...` out of this: those name an artefact rather than an item, and neither
 * `session` nor `trickplay` looks like an identifier. They are reached only by an address handed out
 * by a route that did pass through here.
 *
 * @param path - The address being asked for.
 * @returns What it is about, or nothing where it is about no particular thing.
 */
const subjectOfRequest = (path: string): Subject => {
  for (const route of ITEM_ROUTES) {
    const found = route.exec(path);

    if (found?.[1] !== undefined) {
      return { kind: 'item', mediaId: found[1] };
    }
  }

  for (const route of SERIES_ROUTES) {
    const found = route.exec(path);

    if (found?.[1] !== undefined) {
      return { kind: 'series', seriesId: found[1] };
    }
  }

  return { kind: 'none' };
};

export type { Subject };

export { subjectOfRequest };
