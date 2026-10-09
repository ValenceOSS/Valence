import { describe, expect, it } from 'vitest';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { isVideoKind } from './isVideoKind';

describe('isVideoKind', () => {
  it('counts films, shows and anime as things to watch, and nothing else', () => {
    expect(LIBRARY_KINDS.filter((kind) => isVideoKind(kind))).toEqual(['movies', 'shows', 'anime']);
  });
});
