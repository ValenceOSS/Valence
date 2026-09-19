import type { IndexerRecord, IndexerStore } from '@ValenceRequests/indexers/IndexerRecord';

/**
 * Indexers held in memory, for tests of everything that keeps them without a database.
 *
 * @param given - The indexers to start with.
 * @returns The store.
 */
const createMemoryIndexerStore = (given: readonly IndexerRecord[] = []): IndexerStore => {
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

export { createMemoryIndexerStore };
