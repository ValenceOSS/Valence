import type { Indexer } from '@ValenceContracts/schemas/Indexer';

/**
 * Picks the indexers testing them all should ask: every one that is on, and every one Valence
 * turned off after failing, since answering switches it back on. One somebody switched off stays
 * alone.
 *
 * @param indexers - Every indexer.
 * @returns The ones to test.
 */
const whichToTest = (indexers: readonly Indexer[]): Indexer[] =>
  indexers.filter((indexer) => indexer.isEnabled || indexer.turnedOffBecause !== null);

export { whichToTest };
