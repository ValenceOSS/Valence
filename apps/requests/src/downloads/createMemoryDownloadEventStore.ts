import type { DownloadEvent } from '@ValenceContracts/schemas/DownloadQueue';
import type { DownloadEventStore } from '@ValenceRequests/downloads/DownloadEventStore';

/**
 * Events held in memory, for tests of everything that raises them without a database.
 *
 * @param now - The clock.
 * @returns The store.
 */
const createMemoryDownloadEventStore = (now: () => Date = () => new Date()): DownloadEventStore => {
  let next = 1;
  let held: DownloadEvent[] = [];

  return {
    add: (event) => {
      const kept = { ...event, id: next, at: now().toISOString() };

      next += 1;
      held = [...held, kept];

      return Promise.resolve(kept);
    },
    pending: () => Promise.resolve(held),
    acknowledge: (ids) => {
      held = held.filter((event) => !ids.includes(event.id));

      return Promise.resolve();
    },
  };
};

export { createMemoryDownloadEventStore };
