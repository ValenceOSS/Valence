import { STANDARD_CATEGORIES } from '@ValenceRequests/cardigann/STANDARD_CATEGORIES';
import type { IndexerCapabilities } from '@ValenceContracts/schemas/Indexer';

const NAMES = new Map(STANDARD_CATEGORIES);

const BOOK_CAPABILITIES: IndexerCapabilities = {
  categories: [
    [7000, 7020],
    [3000, 3030],
  ].map(([id = 0, sub = 0]) => ({
    id,
    name: NAMES.get(id) ?? '',
    subcategories: [{ id: sub, name: NAMES.get(sub) ?? '' }],
  })),
  modes: [
    { mode: 'search', parameters: ['q'] },
    { mode: 'book', parameters: ['q'] },
  ],
  limit: null,
};

export { BOOK_CAPABILITIES };
