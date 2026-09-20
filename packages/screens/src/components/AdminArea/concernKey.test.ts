import { describe, expect, it } from 'vitest';
import { concernKey } from './concernKey';

describe('concernKey', () => {
  it('tells concerns apart by what they say, not by their detail', () => {
    expect(concernKey({ id: 'requests-indexers', title: 'The indexer 1337x keeps failing' })).toBe(
      'requests-indexers:The indexer 1337x keeps failing',
    );
    expect(concernKey({ id: 'disk', title: 'The library disk is nearly full' })).not.toBe(
      concernKey({ id: 'requests-indexers', title: 'The library disk is nearly full' }),
    );
  });
});
