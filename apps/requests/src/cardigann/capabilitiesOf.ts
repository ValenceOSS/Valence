import { createCategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { IndexerCapabilities, IndexerSearchMode } from '@ValenceContracts/schemas/Indexer';

const MODES: Readonly<Record<string, IndexerSearchMode>> = {
  search: 'search',
  'tv-search': 'tv',
  'movie-search': 'movie',
  'music-search': 'music',
  'audio-search': 'music',
  'book-search': 'book',
};

/**
 * What a site described by a definition can search, in the same terms a Torznab indexer says so:
 * its categories as the standard ones, and the kinds of search it takes with their parameters.
 *
 * @param definition - The definition.
 * @returns What it can do.
 */
const capabilitiesOf = (definition: CardigannDefinition): IndexerCapabilities => ({
  categories: createCategoryMap(definition.caps).standard(),
  modes: Object.entries(definition.caps.modes).flatMap(([name, parameters]) => {
    const mode = MODES[name];

    return mode === undefined ? [] : [{ mode, parameters: parameters ?? [] }];
  }),
  limit: null,
});

export { capabilitiesOf };
