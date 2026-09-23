import { describe, expect, it } from 'vitest';
import { bookQueries } from './bookQueries';

describe('bookQueries', () => {
  it('keeps every book query under one key, so a scan can refresh them all', () => {
    const keys = [
      bookQueries.inLibrary('l').queryKey,
      bookQueries.one('b').queryKey,
      bookQueries.progress('b').queryKey,
      bookQueries.contents('b', 'c').queryKey,
      bookQueries.document('b', 'c', 0).queryKey,
      bookQueries.find({ search: 'austen' }).queryKey,
      bookQueries.reading().queryKey,
      bookQueries.listening().queryKey,
      bookQueries.listeningPlace('b').queryKey,
    ];

    for (const key of keys) {
      expect(key[0]).toBe(bookQueries.key[0]);
    }
  });

  it('asks the same question of the same books in any order', () => {
    expect(bookQueries.find({ ids: ['b', 'a'] }).queryKey).toEqual(
      bookQueries.find({ ids: ['a', 'b'] }).queryKey,
    );
  });

  it('asks nothing for no books at all', () => {
    expect(bookQueries.find({ ids: [] }).enabled).toBe(false);
  });

  it('keeps a part of a book for as long as the page is open, since a file does not change', () => {
    expect(bookQueries.document('b', 'c', 2).staleTime).toBe(Infinity);
    expect(bookQueries.contents('b', 'c').staleTime).toBe(Infinity);
  });

  it('tells one part of a book from the next', () => {
    expect(bookQueries.document('b', 'c', 1).queryKey).not.toEqual(
      bookQueries.document('b', 'c', 2).queryKey,
    );
  });
});
