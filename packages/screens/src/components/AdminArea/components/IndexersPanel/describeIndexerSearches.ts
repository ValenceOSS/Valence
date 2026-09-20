import type { Indexer, IndexerSearchMode } from '@ValenceContracts/schemas/Indexer';

const MODE_WORDS: Record<IndexerSearchMode, string> = {
  search: 'Words',
  movie: 'Films',
  tv: 'Series',
  music: 'Music',
  book: 'Books',
};

/**
 * Says what an indexer can be searched for, in the words the page uses.
 *
 * @param indexer - The indexer.
 * @returns The kinds of search it takes, or that nobody has asked yet.
 */
const describeIndexerSearches = (indexer: Indexer): string =>
  indexer.capabilities === null
    ? 'Test it to find out'
    : indexer.capabilities.modes.map((one) => MODE_WORDS[one.mode]).join(' · ') || 'Words';

export { describeIndexerSearches };
