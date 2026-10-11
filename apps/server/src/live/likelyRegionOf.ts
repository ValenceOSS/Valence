const NOT_A_PLACE = new Set(['SD', 'HD', 'FHD', 'UHD', '4K']);

/**
 * Where a channel most likely plays, read from its iptv-org guide id: `F1Channel.ie@US` is an Irish
 * channel's US feed, so a stream of it that is geo-blocked almost always plays only in the US, and
 * a feed named for its picture rather than a place, as `@SD` is, plays where the channel is from.
 *
 * @param guideId - The channel's guide id, if it has one.
 * @returns A two-letter country code, or nothing where the id names none.
 */
const likelyRegionOf = (guideId: string | null): string | null => {
  const found = /\.([a-z]{2})(?:@([A-Za-z0-9]+))?$/u.exec(guideId ?? '');

  if (found === null) {
    return null;
  }

  const [, country = '', feed = ''] = found;

  return /^[A-Z]{2}$/u.test(feed) && !NOT_A_PLACE.has(feed) ? feed : country.toUpperCase();
};

export { likelyRegionOf };
