import { describe, expect, it } from 'vitest';
import { whereToOpen } from './whereToOpen';

const BOOK = '00000000-0000-4000-8000-000000000001';

const ONE = '00000000-0000-4000-8000-00000000000a';

const TWO = '00000000-0000-4000-8000-00000000000b';

const chapter = (id: string, number: number) => ({
  id,
  bookId: BOOK,
  title: `Chapter ${number.toString()}`,
  number,
  pageCount: 20,
  format: 'cbz' as const,
  addedAt: '2026-08-01T10:00:00.000Z',
});

const read = (
  chapterId: string,
  at: string,
  place: { pageNumber?: number; fraction?: number },
) => ({
  bookId: BOOK,
  chapterId,
  pageNumber: place.pageNumber ?? null,
  fraction: place.fraction ?? null,
  isFinished: false,
  updatedAt: at,
});

describe('whereToOpen', () => {
  it('opens the first chapter at its start when nothing has been read', () => {
    expect(whereToOpen([chapter(ONE, 1), chapter(TWO, 2)], [], null)).toEqual({
      chapterId: ONE,
      startAtPage: 0,
      startAtFraction: 0,
    });
  });

  it('carries on in the chapter read most recently, at the page reached', () => {
    const progress = [
      read(ONE, '2026-09-01T10:00:00.000Z', { pageNumber: 19 }),
      read(TWO, '2026-09-02T10:00:00.000Z', { pageNumber: 6 }),
    ];

    expect(whereToOpen([chapter(ONE, 1), chapter(TWO, 2)], progress, null)).toEqual({
      chapterId: TWO,
      startAtPage: 6,
      startAtFraction: 0,
    });
  });

  it('carries on at the fraction reached in a book whose text reflows', () => {
    const progress = [read(ONE, '2026-09-01T10:00:00.000Z', { fraction: 0.42 })];

    expect(whereToOpen([chapter(ONE, 1)], progress, null).startAtFraction).toBe(0.42);
  });

  it('opens a picked chapter at its start', () => {
    const progress = [read(ONE, '2026-09-01T10:00:00.000Z', { pageNumber: 12 })];

    expect(whereToOpen([chapter(ONE, 1), chapter(TWO, 2)], progress, TWO)).toEqual({
      chapterId: TWO,
      startAtPage: 0,
      startAtFraction: 0,
    });
  });

  it('opens nothing in a book with no chapters', () => {
    expect(whereToOpen([], [], null).chapterId).toBe('');
  });
});
