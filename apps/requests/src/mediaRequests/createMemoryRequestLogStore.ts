import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';

/**
 * What each request has done, held in memory, for tests of everything that says so without a
 * database.
 *
 * @param now - The clock.
 * @returns The store, and every line in the order it was said.
 */
const createMemoryRequestLogStore = (now: () => Date = () => new Date()) => {
  const said: Array<RequestLogEntry & { requestId: string }> = [];

  const store: RequestLogStore = {
    add: (requestId, message, problemCode = null) => {
      said.push({
        id: said.length + 1,
        requestId,
        message,
        problemCode,
        at: now().toISOString(),
      });

      return Promise.resolve();
    },
    list: (requestId) =>
      Promise.resolve(
        said
          .filter((line) => line.requestId === requestId)
          .map(({ id, at, message, problemCode }) => ({ id, at, message, problemCode }))
          .toReversed(),
      ),
  };

  return { store, said };
};

export { createMemoryRequestLogStore };
