import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { seriesBookDraft } from './seriesBookDraft';

const BOOK = {
  asin: 'B000000001',
  title: 'First',
  position: '1',
  isCompanion: false,
  author: 'An Author',
  year: 2020,
  openLibraryId: 11,
  coverUrl: 'https://covers.test/11.jpg',
  narrations: [],
};

describe('seriesBookDraft', () => {
  it('asks for a book of the series as the series was asked for', () => {
    const series = aMediaRequest({
      kind: 'bookSeries',
      libraryId: 'books',
      libraryPath: '/media/Books',
      bookFormats: ['ebook', 'audiobook'],
      approval: 'approved',
    });

    expect(seriesBookDraft(series, BOOK, ['B000000009'])).toMatchObject({
      kind: 'book',
      openLibraryId: 11,
      libraryId: 'books',
      libraryPath: '/media/Books',
      bookFormats: ['ebook', 'audiobook'],
      narrationsWanted: ['B000000009'],
      isApproved: true,
      catalogue: {
        title: 'First',
        artist: 'An Author',
        year: 2020,
        posterUrl: 'https://covers.test/11.jpg',
      },
    });
  });

  it('asks for nothing of a book Open Library does not know', () => {
    expect(seriesBookDraft(aMediaRequest(), { ...BOOK, openLibraryId: null }, null)).toBeNull();
  });
});
