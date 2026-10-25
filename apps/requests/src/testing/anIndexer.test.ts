import { describe, expect, it } from 'vitest';
import { anIndexer } from './anIndexer';

describe('anIndexer', () => {
  it('makes an indexer for every library with what was changed', () => {
    expect(anIndexer({ name: 'AnimeTracker', libraryIds: ['anime'] })).toMatchObject({
      kind: 'torznab',
      name: 'AnimeTracker',
      libraryIds: ['anime'],
    });
  });
});
