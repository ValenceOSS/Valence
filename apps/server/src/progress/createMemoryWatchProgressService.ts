import type { WatchProgressService } from './WatchProgressService';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type MemoryState = Record<string, WatchProgress[]>;

/**
 * Watch progress held in memory, so the routes can be exercised without Postgres.
 *
 * @param state - Any positions already recorded.
 * @returns The watch progress service.
 */
const createMemoryWatchProgressService = (
  state: MemoryState = {},
): WatchProgressService & { state: MemoryState } => {
  const dismissed = new Set<string>();
  const keyOf = (userId: string, mediaId: string) => `${userId}:${mediaId}`;

  return {
    state,

    list: (userId) =>
      Promise.resolve(
        (state[userId] ?? []).map((entry) => ({
          ...entry,
          isDismissed: dismissed.has(keyOf(userId, entry.mediaId)),
        })),
      ),

    read: (userId, mediaId) =>
      Promise.resolve((state[userId] ?? []).find((entry) => entry.mediaId === mediaId) ?? null),

    record: (userId, report) => {
      const existing = (state[userId] ?? []).filter((entry) => entry.mediaId !== report.mediaId);

      state[userId] = [{ ...report, updatedAt: new Date(0).toISOString() }, ...existing];
      dismissed.delete(keyOf(userId, report.mediaId));

      return Promise.resolve();
    },

    forget: (userId, mediaId) => {
      state[userId] = (state[userId] ?? []).filter((entry) => entry.mediaId !== mediaId);

      return Promise.resolve();
    },

    dismiss: (userId, mediaId) => {
      dismissed.add(keyOf(userId, mediaId));

      return Promise.resolve();
    },

    restore: (userId, mediaId) => {
      dismissed.delete(keyOf(userId, mediaId));

      return Promise.resolve();
    },
  };
};

export type { MemoryState };

export { createMemoryWatchProgressService };
