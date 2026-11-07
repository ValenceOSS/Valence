import { parentPort } from 'node:worker_threads';
import { createCategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import { readSearchResults } from '@ValenceRequests/cardigann/readSearchResults';
import type { SearchResultsAsked } from '@ValenceRequests/cardigann/SearchResultsReader';

/**
 * Reads one page of an indexer's results sent over by the service, off its main thread: the page
 * parsed and every row turned into a release, with the indexer's categories worked out here from its
 * definition, since the map the service holds cannot be sent. Anything that cannot be read is
 * answered as a failure under the same number, so the service is never left waiting.
 *
 * @param message - What the service sent: a number to answer under, and the page.
 */
const answer = (message: { id: number; asked: SearchResultsAsked }): void => {
  try {
    const releases = readSearchResults({
      ...message.asked,
      categories: createCategoryMap(message.asked.definition.caps),
    });

    parentPort?.postMessage({ id: message.id, releases });
  } catch (error) {
    parentPort?.postMessage({
      id: message.id,
      failure: error instanceof Error ? error.message : String(error),
    });
  }
};

parentPort?.on('message', answer);
