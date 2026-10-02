import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { bookQueries } from './bookQueries';

const books = vi.hoisted(() => ({
  fetchBook: vi.fn(),
  fetchBookContents: vi.fn(),
  fetchBookDocument: vi.fn(),
  fetchBooks: vi.fn(),
  fetchReading: vi.fn(),
  fetchReadingProgress: vi.fn(),
  findBooks: vi.fn(),
}));

const listening = vi.hoisted(() => ({
  fetchListening: vi.fn(),
  fetchListeningProgress: vi.fn(),
}));

vi.mock('@ValenceClient/books/fetchBooks', () => books);
vi.mock('@ValenceClient/books/fetchListening', () => listening);

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

describe('bookQueries, asked', () => {
  it('asks the reader each query names, with what it was given', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    for (const reader of [...Object.values(books), ...Object.values(listening)]) {
      reader.mockResolvedValue('read');
    }

    await cache.fetchQuery(bookQueries.inLibrary('l'));
    await cache.fetchQuery(bookQueries.one('b'));
    await cache.fetchQuery(bookQueries.progress('b'));
    await cache.fetchQuery(bookQueries.contents('b', 'c'));
    await cache.fetchQuery(bookQueries.document('b', 'c', 2));
    await cache.fetchQuery(bookQueries.find({ search: 'austen' }));
    await cache.fetchQuery(bookQueries.reading());
    await cache.fetchQuery(bookQueries.listening());
    await cache.fetchQuery(bookQueries.listeningPlace('b'));

    expect(books.fetchBooks).toHaveBeenCalledWith('l');
    expect(books.fetchBook).toHaveBeenCalledWith('b');
    expect(books.fetchReadingProgress).toHaveBeenCalledWith('b');
    expect(books.fetchBookContents).toHaveBeenCalledWith('b', 'c');
    expect(books.fetchBookDocument).toHaveBeenCalledWith('b', 'c', 2);
    expect(books.findBooks).toHaveBeenCalledWith({ search: 'austen' });
    expect(books.fetchReading).toHaveBeenCalledOnce();
    expect(listening.fetchListening).toHaveBeenCalledOnce();
    expect(listening.fetchListeningProgress).toHaveBeenCalledWith('b');
  });
});
