import { describe, expect, it } from 'vitest';
import { anIndexer } from './anIndexer';

describe('anIndexer', () => {
  it('makes an indexer for every library with what was changed', () => {
    expect(anIndexer({ name: 'Nyaa', libraryIds: ['anime'] })).toMatchObject({
      kind: 'torznab',
      name: 'Nyaa',
      libraryIds: ['anime'],
    });
  });
});
