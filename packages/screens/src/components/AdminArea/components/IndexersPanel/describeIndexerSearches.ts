import type { Indexer, IndexerSearchMode } from '@ValenceContracts/schemas/Indexer';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const MODE_WORDS: Record<IndexerSearchMode, StringKey> = {
  search: 'admin.describeIndexerSearches.words',
  movie: 'admin.describeIndexerSearches.films',
  tv: 'admin.describeIndexerSearches.series',
  music: 'admin.describeIndexerSearches.music',
  book: 'admin.describeIndexerSearches.books',
};

/**
 * Says what an indexer can be searched for, in the words the page uses.
 *
 * @param indexer - The indexer.
 * @returns The kinds of search it takes, or that nobody has asked yet.
 */
const describeIndexerSearches = (indexer: Indexer): string =>
  indexer.capabilities === null
    ? say('admin.describeIndexerSearches.testToFindOut')
    : indexer.capabilities.modes.map((one) => say(MODE_WORDS[one.mode])).join(' · ') ||
      say('admin.describeIndexerSearches.words');

export { describeIndexerSearches };
