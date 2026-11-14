import { describe, expect, it } from 'vitest';
import { isVideoLibrary } from './isVideoLibrary';

describe('isVideoLibrary', () => {
  it('shows films and programmes, and leaves out music and books', () => {
    const kinds = ['movies', 'shows', 'anime', 'music', 'books'] as const;

    expect(kinds.map((kind) => isVideoLibrary({ kind }))).toEqual([true, true, true, false, false]);
  });
});
