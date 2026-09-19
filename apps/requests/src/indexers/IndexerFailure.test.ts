import { describe, expect, it } from 'vitest';
import { IndexerFailure } from './IndexerFailure';

describe('IndexerFailure', () => {
  it('carries the reason as its message', () => {
    const failure = new IndexerFailure('The indexer refused the API key');

    expect(failure.message).toBe('The indexer refused the API key');
    expect(failure.name).toBe('IndexerFailure');
    expect(failure).toBeInstanceOf(Error);
  });
});
