import { describe, expect, it } from 'vitest';
import { readTypedQuery } from './readTypedQuery';

describe('readTypedQuery', () => {
  it('reads what was typed, with its spacing tidied', () => {
    expect(readTypedQuery('  Star   Trek 2009 ')).toBe('Star Trek 2009');
  });

  it('reads nothing where nothing, or only space, was typed', () => {
    expect(readTypedQuery(undefined)).toBeNull();
    expect(readTypedQuery('   ')).toBeNull();
  });

  it('keeps no more than an indexer is asked for', () => {
    expect(readTypedQuery('a'.repeat(300))).toHaveLength(200);
  });
});
