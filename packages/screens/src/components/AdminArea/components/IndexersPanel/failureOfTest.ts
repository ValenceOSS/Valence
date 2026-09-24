import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { IndexerTest } from '@ValenceContracts/schemas/Indexer';

/**
 * Says why testing an indexer failed, naming it: the server's refusal where it refused, or the
 * indexer's own problem where it did not answer.
 *
 * @param name - The indexer's name, to say which one failed.
 * @param sent - What testing it came back with.
 * @returns Why it failed, or nothing where it answered.
 */
const failureOfTest = (name: string, { value, refusal }: Sent<IndexerTest>): string | null =>
  refusal === null
    ? value?.isWorking === false
      ? `${name}: ${value.problem ?? 'did not answer'}`
      : null
    : `${name}: ${refusal.message}`;

export { failureOfTest };
