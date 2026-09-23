import { describe, expect, it } from 'vitest';
import { describeWhereItGoes } from './describeWhereItGoes';

const LIBRARIES = [
  { kind: 'music' as const, name: 'Albums' },
  { kind: 'movies' as const, name: 'Films' },
];

describe('describeWhereItGoes', () => {
  it('files a film into the first library of films', () => {
    expect(describeWhereItGoes('movies', LIBRARIES, 'valence-films')).toBe(
      'As a film, filed into Films once it has downloaded.',
    );
  });

  it('says a series has nowhere to go without a library of series', () => {
    expect(describeWhereItGoes('shows', LIBRARIES, 'valence-series')).toBe(
      'As a series. There is no library of series to file it into, so it stays in the client under valence-series.',
    );
  });

  it('files music and books into their own libraries too', () => {
    expect(describeWhereItGoes('music', LIBRARIES, 'valence-music')).toBe(
      'As music, filed into Albums once it has downloaded.',
    );
    expect(describeWhereItGoes('books', LIBRARIES, 'valence-books')).toBe(
      'As a book. There is no library of books to file it into, so it stays in the client under valence-books.',
    );
  });
});
