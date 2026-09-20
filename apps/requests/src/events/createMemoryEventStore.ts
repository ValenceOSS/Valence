import { ServiceEventSchema } from '@ValenceContracts/schemas/DownloadQueue';
import type { ServiceEvent } from '@ValenceContracts/schemas/DownloadQueue';
import type { EventStore } from '@ValenceRequests/events/EventStore';

/**
 * Events held in memory, for tests of everything that raises them without a database.
 *
 * @param now - The clock.
 * @returns The store.
 */
const createMemoryEventStore = (now: () => Date = () => new Date()): EventStore => {
  let next = 1;
  let held: ServiceEvent[] = [];

  return {
    add: (event) => {
      const kept = ServiceEventSchema.parse({ ...event, id: next, at: now().toISOString() });

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

export { createMemoryEventStore };
