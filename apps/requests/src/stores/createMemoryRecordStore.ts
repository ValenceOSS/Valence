import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

/**
 * Records held in memory, for tests of everything that keeps them without a database.
 *
 * @param given - The records to start with.
 * @returns The store.
 */
const createMemoryRecordStore = <Kept extends { id: string }>(
  given: readonly Kept[] = [],
): RecordStore<Kept> => {
  const held = new Map(given.map((record) => [record.id, record]));

  return {
    list: () => Promise.resolve([...held.values()]),
    find: (id) => Promise.resolve(held.get(id) ?? null),
    insert: (record) => {
      held.set(record.id, record);

      return Promise.resolve(record);
    },
    update: (id, changes) => {
      const current = held.get(id);

      if (current === undefined) {
        return Promise.resolve(null);
      }

      const next = { ...current, ...changes };

      held.set(id, next);

      return Promise.resolve(next);
    },
    remove: (id) => Promise.resolve(held.delete(id)),
  };
};

export { createMemoryRecordStore };
