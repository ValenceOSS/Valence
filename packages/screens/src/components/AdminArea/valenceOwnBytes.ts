import type { AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';

/**
 * How much Valence itself has put on the disk: preview clips, scrub thumbnails, what running
 * sessions have written, artwork and the pages of books, without the library it was all made from.
 *
 * @param cache - What the monitor found on disk, or null while it is still counting.
 * @param artwork - How much artwork has been fetched and kept.
 * @param bookPages - How much the kept pages of books hold.
 * @returns The bytes, counting whatever has not been measured yet as none.
 */
const valenceOwnBytes = (
  cache: Monitor['cache'],
  artwork: AdminOverview['artwork'],
  bookPages: AdminOverview['bookPages'] | null,
): number =>
  (cache === null ? 0 : cache.previews.bytes + cache.trickplay.bytes + cache.sessions.bytes) +
  (artwork?.bytes ?? 0) +
  (bookPages?.bytes ?? 0);

export { valenceOwnBytes };
