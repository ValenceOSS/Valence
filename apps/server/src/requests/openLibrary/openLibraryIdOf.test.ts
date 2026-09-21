import { describe, expect, it } from 'vitest';
import { openLibraryIdOf } from '@ValenceServer/requests/openLibrary/openLibraryIdOf';

describe('openLibraryIdOf', () => {
  it('reads the number out of a work key, with or without its path', () => {
    expect(openLibraryIdOf('/works/OL27448W')).toBe(27448);
    expect(openLibraryIdOf('works/OL27448W')).toBe(27448);
    expect(openLibraryIdOf('OL27448W')).toBe(27448);
  });

  it('is nothing for a key that is not a work’s', () => {
    expect(openLibraryIdOf('/authors/OL26320A')).toBeNull();
    expect(openLibraryIdOf('/books/OL7353617M')).toBeNull();
    expect(openLibraryIdOf('OL0W')).toBeNull();
    expect(openLibraryIdOf('')).toBeNull();
    expect(openLibraryIdOf('/works/OLxW')).toBeNull();
  });
});
