import { describe, expect, it } from 'vitest';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { isEpisodicKind } from './isEpisodicKind';

describe('isEpisodicKind', () => {
  it('counts shows and anime as series of episodes, and nothing else', () => {
    expect(LIBRARY_KINDS.filter((kind) => isEpisodicKind(kind))).toEqual(['shows', 'anime']);
  });
});
