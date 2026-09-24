import { testIndexer } from '@ValenceClient/requests/fetchIndexers';
import { failureOfTest } from './failureOfTest';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

/**
 * Tests an indexer and says why it failed, naming it, including where its answer could not even be
 * read, so that one bad answer never stops the rest of a round from being told.
 *
 * @param indexer - The indexer.
 * @returns Why it failed, or nothing where it answered.
 */
const testAndSayWhy = ({ id, name }: Pick<Indexer, 'id' | 'name'>): Promise<string | null> =>
  testIndexer(id).then(
    (sent) => failureOfTest(name, sent),
    () => `${name}: its answer could not be read`,
  );

export { testAndSayWhy };
