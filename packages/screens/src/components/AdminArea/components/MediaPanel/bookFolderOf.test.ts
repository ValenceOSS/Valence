import { describe, expect, it } from 'vitest';
import { bookFolderOf } from './bookFolderOf';

describe('bookFolderOf', () => {
  it('opens the folder a loose book file sits in', () => {
    expect(bookFolderOf('/media/books/Dune.epub')).toBe('/media/books');
  });

  it('opens a book that is a folder of chapters itself', () => {
    expect(bookFolderOf('/media/books/Frank Herbert/Dune')).toBe('/media/books/Frank Herbert/Dune');
  });

  it('opens an audiobook folder whose name has a full stop in it', () => {
    expect(bookFolderOf('/media/books/Vol. 2')).toBe('/media/books/Vol. 2');
  });
});
