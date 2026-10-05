import { canonicalIdOf } from '@ValenceServer/visibility/canonicalIdOf';

type Subject =
  | { kind: 'item'; mediaId: string }
  | { kind: 'series'; seriesId: string }
  | { kind: 'none' };

const ITEM_ROUTES: readonly RegExp[] = [
  /^\/api\/media\/([^/]+)(\/.*)?$/,
  /^\/api\/playback\/([^/]+)(\/.*)?$/,
  /^\/api\/music\/tracks\/([^/]+)(\/.*)?$/,
];

const SERIES_ROUTES: readonly RegExp[] = [/^\/api\/series\/([^/]+)(\/.*)?$/];

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
 * by a route that did pass through here. Every spelling of an identifier the database accepts is
 * read as the item it reaches, in its usual spelling, so writing one without its hyphens or in braces
 * does not walk past the judgement and still reach the item.
 *
 * @param path - The address being asked for.
 * @returns What it is about, or nothing where it is about no particular thing.
 */
const subjectOfRequest = (path: string): Subject => {
  for (const route of ITEM_ROUTES) {
    const found = route.exec(path);

    if (found?.[1] !== undefined) {
      const mediaId = canonicalIdOf(found[1]);

      if (mediaId !== null) {
        return { kind: 'item', mediaId };
      }
    }
  }

  for (const route of SERIES_ROUTES) {
    const found = route.exec(path);

    if (found?.[1] !== undefined) {
      const seriesId = canonicalIdOf(found[1]);

      if (seriesId !== null) {
        return { kind: 'series', seriesId };
      }
    }
  }

  return { kind: 'none' };
};

export type { Subject };

export { subjectOfRequest };
