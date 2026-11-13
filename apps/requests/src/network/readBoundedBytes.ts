import type { ReadableStreamDefaultReader, ReadableStreamReadResult } from 'node:stream/web';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { saying } from '@ValenceI18n/saying';

/**
 * Reads an answer's body, giving up as soon as it is longer than the limit, so a host that streams
 * without end cannot fill the service's memory.
 *
 * @param response - The answer, whose body this reads.
 * @param limit - The most bytes to accept.
 * @returns The body.
 */
const readBoundedBytes = async (response: Response, limit: number): Promise<Uint8Array> => {
  const refuse = async (): Promise<never> => {
    await response.body?.cancel().catch(() => undefined);

    throw new IndexerFailure(saying('requests.indexers.indexerService.theIndexerCouldNotBeAsked'));
  };

  if (Number(response.headers.get('content-length')) > limit) {
    return refuse();
  }

  const reader: ReadableStreamDefaultReader<Uint8Array> | undefined = response.body?.getReader();

  if (reader === undefined) {
    return new Uint8Array();
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const next: ReadableStreamReadResult<Uint8Array> = await reader.read();

    if (next.done) {
      break;
    }

    const value = next.value;

    total += value.byteLength;

    if (total > limit) {
      await reader.cancel().catch(() => undefined);

      return refuse();
    }

    chunks.push(value);
  }

  return new Uint8Array(Buffer.concat(chunks));
};

export { readBoundedBytes };
