import { describe, expect, it } from 'vitest';
import { matchBook } from './matchBook';

const BOOK = { title: 'Project Hail Mary', aliases: [], artistName: 'Andy Weir' };

describe('matchBook', () => {
  it('finds the title in a release named every way books are', () => {
    expect(matchBook(BOOK, 'Andy Weir - Project Hail Mary (2021) [EPUB]')).toBe(true);
    expect(matchBook(BOOK, 'Project.Hail.Mary.2021.RETAIL.EPUB-GRP')).toBe(true);
    expect(matchBook(BOOK, 'Project Hail Mary - Andy Weir (Unabridged) M4B')).toBe(true);
  });

  it('refuses another book', () => {
    expect(matchBook(BOOK, 'Andy Weir - The Martian (2014) [EPUB]')).toBe(false);
    expect(matchBook(BOOK, 'Project Hail')).toBe(false);
  });

  it('wants the author too for a title of a word or two', () => {
    const short = { title: 'Artemis', aliases: [], artistName: 'Andy Weir' };

    expect(matchBook(short, 'Andy Weir - Artemis EPUB')).toBe(true);
    expect(matchBook(short, 'Artemis Fowl EPUB')).toBe(false);
  });
});
