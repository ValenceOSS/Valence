import type { CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Where a corner is along a page turned by itself, from a key or a button rather than a hand: it
 * travels from where it starts to where it ends, rising in towards the middle of the page on the
 * way, as a corner lifted and carried over does.
 *
 * @param from - Where the corner starts.
 * @param to - Where it ends.
 * @param rise - How far it rises at the middle of the turn, downwards positive: into the page for a
 *   top corner, up into it for a bottom one.
 * @param share - How far along the turn it is, from nothing to all of it.
 * @returns Where the corner is.
 */
const curlArcAt = (from: CurlPoint, to: CurlPoint, rise: number, share: number): CurlPoint => ({
  x: from.x + (to.x - from.x) * share,
  y: from.y + (to.y - from.y) * share + Math.sin(Math.PI * share) * rise,
});

export { curlArcAt };
