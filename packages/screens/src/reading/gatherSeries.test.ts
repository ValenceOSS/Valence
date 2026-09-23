import { describe, expect, it } from 'vitest';
import { gatherSeries, inSeriesOrder } from '@ValenceScreens/reading/gatherSeries';
import { anAudiobook } from '@ValenceScreens/testing/anAudiobook';
import type { Book } from '@ValenceContracts/schemas/Book';

/**
 * A book on the shelf, in a series where it says so.
 *
 * @param title - What it is called.
 * @param series - The series it is in, and its place.
 * @param year - When it came out.
 * @returns The book.
 */
const aBook = (
  title: string,
  series: { name: string; position: number | null } | null = null,
  year: number | null = null,
): Book => ({ ...anAudiobook().book, id: title, title, series, year });

describe('gatherSeries', () => {
  it('gathers a series into one place on the shelf, where its first book was', () => {
    const shelf = gatherSeries([
      aBook('Alice'),
      aBook('Golden Son', { name: 'Red Rising', position: 2 }),
      aBook('Pride and Prejudice'),
      aBook('Red Rising', { name: 'red rising ', position: 1 }),
    ]);

    expect(shelf.map((one) => (one.kind === 'book' ? one.book.title : one.series.name))).toEqual([
      'Alice',
      'Red Rising',
      'Pride and Prejudice',
    ]);
    expect(
      shelf[1]?.kind === 'series' ? shelf[1].series.books.map((book) => book.title) : [],
    ).toEqual(['Red Rising', 'Golden Son']);
  });

  it('leaves a series of one as the book', () => {
    expect(gatherSeries([aBook('Dune', { name: 'Dune', position: 1 })])[0]?.kind).toBe('book');
  });
});

describe('inSeriesOrder', () => {
  it('orders by place, then year, then title, with no place last', () => {
    expect(
      inSeriesOrder([
        aBook('Loose', { name: 'S', position: null }),
        aBook('Third', { name: 'S', position: 3 }),
        aBook('Later', { name: 'S', position: null }, 2020),
        aBook('First', { name: 'S', position: 1 }),
        aBook('Earlier', { name: 'S', position: null }, 2010),
      ]).map((book) => book.title),
    ).toEqual(['First', 'Third', 'Loose', 'Earlier', 'Later']);
  });
});
