const GEO_BLOCKED = /\[geo-blocked\]/iu;

const PART_TIME = /\[not 24\/7\]/iu;

/**
 * What a channel's name says beyond what it is called: whether its stream is said to be blocked
 * outside some country, and whether it is said not to broadcast all day — as iptv-org writes them,
 * in square brackets after the name — with the name itself left clean of them.
 *
 * @param name - The channel's name, as its playlist gives it.
 * @returns The name without the tags, and what the tags said.
 */
const channelTagsOf = (
  name: string,
): { name: string; isGeoBlocked: boolean; isPartTime: boolean } => ({
  name: name
    .replace(/\s*\[[^\]]*\]/gu, '')
    .replace(/\s{2,}/gu, ' ')
    .trim(),
  isGeoBlocked: GEO_BLOCKED.test(name),
  isPartTime: PART_TIME.test(name),
});

export { channelTagsOf };
