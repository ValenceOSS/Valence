import { randomUUID } from 'node:crypto';
import { decideViewing } from './decideViewing';
import type { HistoryService, Viewing } from './HistoryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type MemoryViewing = Viewing & { profileId: string };

type MemoryHistoryState = {
  viewings: MemoryViewing[];

  titles?: Record<string, string>;

  visibleTo?: (viewer: Viewer, mediaItemId: string) => boolean;
};

/**
 * Viewing history held in memory, so the routes can be exercised without Postgres.
 *
 * Knows nothing of libraries and so cannot work out for itself what a viewer may see, but it does
 * narrow by whatever `visibleTo` says. Without it a test would pass while describing a server that
 * names, in somebody's history, a title their account has since been refused — which is the thing
 * the database version was changed to stop.
 *
 * @param state - Any viewings that already happened, and what this viewer may be told about.
 * @returns The history service.
 */
const createMemoryHistoryService = (
  state: MemoryHistoryState = { viewings: [] },
): HistoryService & { state: MemoryHistoryState } => {
  /**
   * Strips the profile off a viewing before it is answered with, since a caller asking for one
   * profile's history already knows whose it is.
   *
   * @param one - The viewing as stored.
   * @param named - Whether to fill in the item's title, which only the listing needs.
   * @returns The viewing as a caller reads it.
   */
  const shown = (one: MemoryViewing, named = false): Viewing => ({
    id: one.id,
    mediaItemId: one.mediaItemId,
    title: named ? (state.titles?.[one.mediaItemId] ?? null) : null,
    seriesTitle: null,
    startedAt: one.startedAt,
    lastWatchedAt: one.lastWatchedAt,
    secondsWatched: one.secondsWatched,
    isFinished: one.isFinished,
  });

  return {
    state,

    record: (profileId, mediaItemId, seen) => {
      const open = state.viewings
        .filter((one) => one.profileId === profileId && one.mediaItemId === mediaItemId)
        .sort((left, right) => Date.parse(right.lastWatchedAt) - Date.parse(left.lastWatchedAt))[0];

      const decided = decideViewing(
        open === undefined
          ? null
          : {
              id: open.id,
              lastWatchedAt: new Date(open.lastWatchedAt),
              secondsWatched: open.secondsWatched,
              isFinished: open.isFinished,
            },
        seen,
      );

      if (decided.kind === 'ignore') {
        return Promise.resolve(null);
      }

      if (decided.kind === 'extend') {
        const found = state.viewings.find((one) => one.id === decided.id);

        if (found === undefined) {
          return Promise.resolve(null);
        }

        found.secondsWatched = decided.secondsWatched;
        found.isFinished = decided.isFinished;
        found.lastWatchedAt = seen.at.toISOString();

        return Promise.resolve(shown(found));
      }

      const made: MemoryViewing = {
        profileId,
        id: randomUUID(),
        mediaItemId,
        title: null,
        seriesTitle: null,
        startedAt: seen.at.toISOString(),
        lastWatchedAt: seen.at.toISOString(),
        secondsWatched: decided.secondsWatched,
        isFinished: decided.isFinished,
      };

      state.viewings.push(made);

      return Promise.resolve(shown(made));
    },

    list: (viewer, profileId, options = {}) =>
      Promise.resolve(
        state.viewings
          .filter((one) => one.profileId === profileId)
          .filter((one) => state.visibleTo?.(viewer, one.mediaItemId) ?? true)
          .sort((left, right) => Date.parse(right.lastWatchedAt) - Date.parse(left.lastWatchedAt))
          .slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50))
          .map((one) => shown(one, true)),
      ),

    forget: (profileId, viewingId) => {
      const at = state.viewings.findIndex(
        (one) => one.id === viewingId && one.profileId === profileId,
      );

      if (at === -1) {
        return Promise.resolve(false);
      }

      state.viewings.splice(at, 1);

      return Promise.resolve(true);
    },

    prune: (before) => {
      const was = state.viewings.length;

      state.viewings = state.viewings.filter(
        (one) => Date.parse(one.lastWatchedAt) >= before.getTime(),
      );

      return Promise.resolve(was - state.viewings.length);
    },

    forgetAll: (profileId) => {
      const before = state.viewings.length;

      state.viewings = state.viewings.filter((one) => one.profileId !== profileId);

      return Promise.resolve(before - state.viewings.length);
    },
  };
};

export { createMemoryHistoryService };
