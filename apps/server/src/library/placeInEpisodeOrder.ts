/**
 * Finds which of the catalogue's episodes a file is when its numbers follow one of a programme's
 * other orders, such as the DVD order or absolute numbering: the file's season is the order's part
 * of that number, and its episode the place in that part.
 *
 * @param parts - The order's parts, each with its number and its episodes in order.
 * @param season - The file's season, in that order.
 * @param episode - The file's episode, in that order.
 * @param end - The last episode a file of several holds, or nothing.
 * @returns The catalogue's own season and episode for each episode the file holds, or nothing where
 *   the order has no such place.
 */
const placeInEpisodeOrder = (
  parts: readonly { order: number; episodes: readonly { season: number; episode: number }[] }[],
  season: number,
  episode: number,
  end: number | null,
): { season: number; episode: number }[] | null => {
  const part = parts.find((one) => one.order === season);
  const last = Math.max(episode, end ?? episode);
  const held = part?.episodes.slice(episode - 1, last) ?? [];

  return held.length === 0 ? null : held;
};

export { placeInEpisodeOrder };
