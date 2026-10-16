import { describe, expect, it } from 'vitest';
import { authorFromPath } from './authorFromPath';

describe('authorFromPath', () => {
  it('reads the author from the folder a book or its series sits in', () => {
    expect(authorFromPath('/books', '/books/An Author/A Title')).toBe('An Author');
    expect(authorFromPath('/books', '/books/An Author/A Series/2 - A Title')).toBe('An Author');
  });

  it('reads none for a book in the library itself, or under a series alone', () => {
    expect(authorFromPath('/books', '/books/A Title.epub')).toBeNull();
    expect(authorFromPath('/books', '/books/A Series/1 - A Title')).toBeNull();
    expect(authorFromPath('/books', '/elsewhere/An Author/A Title')).toBeNull();
  });
});
