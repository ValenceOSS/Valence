import { isWorthResuming } from '@ValenceContracts/schemas/WatchProgress';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { WatchedOffline } from './watchedOffline';

/**
 * Where to carry on a copy kept on this device: from whichever is newer, where it got to here or
 * where the server says this profile got to, which may be on another device since. A server's place
 * that is not worth resuming, the very start or the credits, starts it from the beginning.
 *
 * @param offline - Where it got to on this device, where it was watched here.
 * @param saved - Where the server says it got to, where it was asked and has an answer.
 * @returns The second to start at, or null to start from the beginning.
 */
const placeToCarryOnFrom = (
  offline: WatchedOffline | undefined,
  saved: WatchProgress | undefined,
): number | null => {
  const savedAt = saved === undefined ? Number.NEGATIVE_INFINITY : Date.parse(saved.updatedAt);
  const offlineAt = offline?.atMs ?? Number.NEGATIVE_INFINITY;

  if (saved !== undefined && savedAt >= offlineAt) {
    return isWorthResuming(saved) ? saved.positionSeconds : null;
  }

  return offline?.positionSeconds ?? null;
};

export { placeToCarryOnFrom };
