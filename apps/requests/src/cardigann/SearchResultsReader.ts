import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { ReadSearchResultsOptions } from '@ValenceRequests/cardigann/readSearchResults';

type SearchResultsAsked = Omit<ReadSearchResultsOptions, 'categories'>;

type SearchResultsReader = (asked: SearchResultsAsked) => Promise<Release[] | null>;

export type { SearchResultsAsked, SearchResultsReader };
