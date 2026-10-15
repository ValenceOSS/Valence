import { describe, expect, it } from 'vitest';
import { readBookFormat } from './readBookFormat';

describe('readBookFormat', () => {
  it('goes by the category the indexer filed it under first', () => {
    expect(readBookFormat({ title: 'Some Book EPUB', categories: [3030] })).toBe('audiobook');
    expect(readBookFormat({ title: 'Some Book M4B', categories: [7020] })).toBe('ebook');
  });

  it('goes by the name where the indexer filed it under Books alone, as many file audiobooks there', () => {
    expect(
      readBookFormat({
        title: 'Author - Some Book - Audiobook - M4B - Someone',
        categories: [7000],
      }),
    ).toBe('audiobook');
    expect(readBookFormat({ title: 'Author - Some Book EPUB', categories: [7000] })).toBe('ebook');
    expect(readBookFormat({ title: 'Author - Some Book [Audiobook]', categories: [8000] })).toBe(
      'audiobook',
    );
    expect(
      readBookFormat({ title: 'Series 7, Some Book [Graphic Audio]', categories: [7000] }),
    ).toBe('audiobook');
  });

  it('goes by what the name says otherwise', () => {
    expect(readBookFormat({ title: 'Author - Some Book (Unabridged) [M4B]', categories: [] })).toBe(
      'audiobook',
    );
    expect(readBookFormat({ title: 'Author - Some Book.epub', categories: [] })).toBe('ebook');
  });

  it('takes a retail audiobook for an audiobook, since retail says where it came from', () => {
    expect(readBookFormat({ title: 'Author - Some Book (Retail) M4B', categories: [] })).toBe(
      'audiobook',
    );
  });

  it('takes a book that says nothing for an audiobook where it is too big to be an ebook', () => {
    expect(
      readBookFormat({
        title: 'Some Book - Series 6 - Author',
        categories: [7000],
        sizeBytes: 370 * 1024 * 1024,
      }),
    ).toBe('audiobook');
    expect(
      readBookFormat({
        title: 'Some Book - Author',
        categories: [7000],
        sizeBytes: 3 * 1024 * 1024,
      }),
    ).toBe('ebook');
  });

  it('takes a book that says nothing for an ebook', () => {
    expect(readBookFormat({ title: 'Author - Some Book', categories: [] })).toBe('ebook');
  });
});
