import type {
  CatalogueState,
  DefinitionRecord,
  DefinitionStore,
} from '@ValenceRequests/definitions/DefinitionRecord';

/**
 * Definitions held in memory, for tests of everything that keeps them without a database.
 *
 * @param given - The definitions to start with.
 * @returns The store.
 */
const createMemoryDefinitionStore = (given: readonly DefinitionRecord[] = []): DefinitionStore => {
  const held = new Map(given.map((record) => [record.id, record]));
  let state: CatalogueState = { updatedAt: null, problem: null };

  return {
    list: () =>
      Promise.resolve(
        [...held.values()].map(
          ({ id, name, description, language, privacy, protocol, categories, sha }) => ({
            id,
            name,
            description,
            language,
            privacy,
            protocol,
            categories,
            sha,
          }),
        ),
      ),
    get: (id) => Promise.resolve(held.get(id) ?? null),
    save: (records) => {
      for (const record of records) {
        held.set(record.id, record);
      }

      return Promise.resolve();
    },
    remove: (ids) => {
      for (const id of ids) {
        held.delete(id);
      }

      return Promise.resolve();
    },
    readState: () => Promise.resolve(state),
    writeState: (next) => {
      state = next;

      return Promise.resolve();
    },
  };
};

export { createMemoryDefinitionStore };
