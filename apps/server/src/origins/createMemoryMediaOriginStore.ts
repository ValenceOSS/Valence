import type { MediaOriginStore, RecordedOrigin } from '@ValenceServer/origins/MediaOriginStore';

/**
 * Keeps where library files came from in memory, for tests and a server run without a database.
 *
 * @returns The store.
 */
const createMemoryMediaOriginStore = (): MediaOriginStore => {
  const held = new Map<string, RecordedOrigin>();
  const keyOf = (origin: RecordedOrigin) => `${origin.libraryId}\n${origin.path}`;

  return {
    record: (origins) => {
      for (const origin of origins) {
        held.set(keyOf(origin), origin);
      }

      return Promise.resolve();
    },

    recordUnlessKnown: (origins) => {
      for (const origin of origins) {
        if (!held.has(keyOf(origin))) {
          held.set(keyOf(origin), origin);
        }
      }

      return Promise.resolve();
    },

    read: (paths) => {
      const wanted = new Set(paths);

      return Promise.resolve(
        Object.fromEntries(
          [...held.values()]
            .filter((origin) => wanted.has(origin.path))
            .map((origin) => [origin.path, { source: origin.source, via: origin.via }]),
        ),
      );
    },
  };
};

export { createMemoryMediaOriginStore };
