import { describe, expect, it } from 'vitest';
import { readBookFormat } from './readBookFormat';

describe('readBookFormat', () => {
  it('goes by the category the indexer filed it under first', () => {
    expect(readBookFormat({ title: 'Some Book EPUB', categories: [3030] })).toBe('audiobook');
    expect(readBookFormat({ title: 'Some Book M4B', categories: [7020] })).toBe('ebook');
  });

  it('goes by what the name says otherwise', () => {
    expect(readBookFormat({ title: 'Author - Some Book (Unabridged) [M4B]', categories: [] })).toBe(
      'audiobook',
    );
    expect(readBookFormat({ title: 'Author - Some Book.epub', categories: [] })).toBe('ebook');
  });

  it('takes a book that says nothing for an ebook', () => {
    expect(readBookFormat({ title: 'Author - Some Book', categories: [] })).toBe('ebook');
  });
});
