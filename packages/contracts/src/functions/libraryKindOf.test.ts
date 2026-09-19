import { describe, expect, it } from 'vitest';
import { libraryKindOf } from './libraryKindOf';

describe('libraryKindOf', () => {
  it('files each kind of request into the library that holds that sort of thing', () => {
    expect(libraryKindOf('film')).toBe('movies');
    expect(libraryKindOf('series')).toBe('shows');
    expect(libraryKindOf('artist')).toBe('music');
    expect(libraryKindOf('album')).toBe('music');
  });
});
