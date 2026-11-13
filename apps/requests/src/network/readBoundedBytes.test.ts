import { describe, expect, it } from 'vitest';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { readBoundedBytes } from './readBoundedBytes';

/**
 * A body of the given chunks that never ends unless it is cancelled.
 */
const endless = (chunk: Uint8Array): Response =>
  new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunk);
      },
    }),
  );

describe('readBoundedBytes', () => {
  it('reads a body within the limit whole', async () => {
    const bytes = await readBoundedBytes(new Response('hello'), 5);

    expect(new TextDecoder().decode(bytes)).toBe('hello');
  });

  it('reads an empty body', async () => {
    expect(await readBoundedBytes(new Response(null), 5)).toHaveLength(0);
  });

  it('refuses a body that says it is longer than the limit', async () => {
    const response = new Response('x', { headers: { 'content-length': '99' } });

    await expect(readBoundedBytes(response, 10)).rejects.toBeInstanceOf(IndexerFailure);
  });

  it('stops reading a body that never ends once it passes the limit', async () => {
    await expect(readBoundedBytes(endless(new Uint8Array(1024)), 4096)).rejects.toBeInstanceOf(
      IndexerFailure,
    );
  });
});
