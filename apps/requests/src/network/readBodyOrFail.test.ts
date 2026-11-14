import { describe, expect, it } from 'vitest';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { readBodyOrFail } from './readBodyOrFail';

describe('readBodyOrFail', () => {
  it('reads a body within the limit whole, and an empty one as nothing', async () => {
    expect(new TextDecoder().decode(await readBodyOrFail(new Response('hello'), 5))).toBe('hello');
    expect(await readBodyOrFail(new Response(null), 5)).toHaveLength(0);
  });

  it('fails the indexer’s request for a body over the limit', async () => {
    await expect(readBodyOrFail(new Response('x'.repeat(11)), 10)).rejects.toBeInstanceOf(
      IndexerFailure,
    );
  });
});
