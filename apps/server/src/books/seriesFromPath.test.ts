import { describe, expect, it } from 'vitest';
import { seriesFromPath } from '@ValenceServer/books/seriesFromPath';

describe('seriesFromPath', () => {
  it('reads the series around a numbered book, and its place', () => {
    expect(seriesFromPath('/books', '/books/Pierce Brown/Red Rising/2 - Golden Son')).toEqual({
      series: { name: 'Red Rising', position: 2 },
      title: 'Golden Son',
    });
    expect(seriesFromPath('/books', '/books/Red Rising/Book 3 - Morning Star')?.series).toEqual({
      name: 'Red Rising',
      position: 3,
    });
    expect(seriesFromPath('/books', '/books/Dune/1.5 Tales')?.series.position).toBe(1.5);
  });

  it('puts a book three folders down in the series around it, with no place', () => {
    expect(seriesFromPath('/books', '/books/Pierce Brown/Red Rising/Golden Son')).toEqual({
      series: { name: 'Red Rising', position: null },
      title: 'Golden Son',
    });
  });

  it('puts a book in its author’s folder, or at the top, in no series', () => {
    expect(seriesFromPath('/books', '/books/Pierce Brown/Golden Son')).toBeNull();
    expect(seriesFromPath('/books', '/books/Golden Son')).toBeNull();
    expect(seriesFromPath('/books', '/elsewhere/A/B/C')).toBeNull();
  });

  it('does not take a year for a place', () => {
    expect(seriesFromPath('/books', '/books/Pierce Brown/1984')).toBeNull();
  });
});
