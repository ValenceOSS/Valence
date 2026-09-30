import type { Indexer, IndexerSearchMode } from '@ValenceContracts/schemas/Indexer';
import { say } from '@ValenceI18n/say';

const MODE_WORDS: Record<IndexerSearchMode, string> = {
  search: say('common.words'),
  movie: say('common.films'),
  tv: say('common.series'),
  music: say('common.music'),
  book: say('common.books'),
};

/**
 * Says what an indexer can be searched for, in the words the page uses.
 *
 * @param indexer - The indexer.
 * @returns The kinds of search it takes, or that nobody has asked yet.
 */
const describeIndexerSearches = (indexer: Indexer): string =>
  indexer.capabilities === null
    ? say('screens.indexersPanel.describeIndexerSearches.testItToFindOut')
    : indexer.capabilities.modes.map((one) => MODE_WORDS[one.mode]).join(' · ') ||
      say('common.words');

export { describeIndexerSearches };
