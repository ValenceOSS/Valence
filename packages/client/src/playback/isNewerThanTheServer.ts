import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

/**
 * Decides whether a position this client noted for itself is newer than what the server last said,
 * so it is shown until the server has caught up and never after, when another screen may have moved
 * on since.
 *
 * @param noted - The position this client noted, stamped when it noted it.
 * @param readAtMs - When the server's positions were last read, or 0 where they never were.
 * @returns Whether the client's own note should stand over the server's.
 */
const isNewerThanTheServer = (noted: WatchProgress, readAtMs: number): boolean =>
  Date.parse(noted.updatedAt) > readAtMs;

export { isNewerThanTheServer };
