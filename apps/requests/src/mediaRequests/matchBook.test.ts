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

  it('refuses another volume of the series a book’s title starts', () => {
    const first = {
      title: 'The Legend of Randidly Ghosthound',
      aliases: [],
      artistName: 'Noret Flood',
      narrations: [
        {
          asin: 'B09CRBSDHY',
          series: 'The Legend of Randidly Ghosthound',
          narrators: ['MacLeod Andrews'],
          seriesAsin: 'B09CTR3Q6K',
          runtimeMinutes: 1389,
          seriesPosition: '1',
        },
      ],
    };

    expect(
      matchBook(first, 'The Legend of Randidly Ghosthound 12 - A LitRPG Adventure - Noret Flood'),
    ).toBe(false);
    expect(matchBook(first, 'The Legend of Randidly Ghosthound 1 - Noret Flood [EPUB]')).toBe(true);
    expect(matchBook(first, 'Noret Flood - The Legend of Randidly Ghosthound (2021) EPUB')).toBe(
      true,
    );
    expect(
      matchBook({ ...first, narrations: [] }, 'The Legend of Randidly Ghosthound 12 - Noret Flood'),
    ).toBe(false);
    expect(
      matchBook(
        { ...first, narrations: [] },
        'The Legend of Randidly Ghosthound 5-8 - Noret Flood',
        { checksVolume: false },
      ),
    ).toBe(true);
  });
});
