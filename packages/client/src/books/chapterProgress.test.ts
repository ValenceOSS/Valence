import { describe, expect, it } from 'vitest';
import { chapterProgress } from './chapterProgress';
import type { BookChapter, ReadingProgress } from '@ValenceContracts/schemas/Book';

const chapter = (id: string, pageCount: number | null): BookChapter => ({
  id,
  bookId: 'b',
  number: 1,
  title: id,
  format: 'cbz',
  pageCount,
  addedAt: '2026-09-24T00:00:00.000Z',
});

const got = (overrides: Partial<ReadingProgress>): ReadingProgress => ({
  bookId: 'b',
  chapterId: 'c1',
  pageNumber: null,
  fraction: null,
  isFinished: false,
  updatedAt: '2026-09-24T00:00:00.000Z',
  ...overrides,
});

describe('chapterProgress', () => {
  it('reads a finished chapter as all of it, a paged one by the page reached, and an unopened one as none', () => {
    const read = chapterProgress(
      [chapter('c1', 20), chapter('c2', 20), chapter('c3', 20), chapter('c4', null)],
      [
        got({ chapterId: 'c1', isFinished: true }),
        got({ chapterId: 'c2', pageNumber: 9 }),
        got({ chapterId: 'c4', fraction: 0.3 }),
      ],
    );

    expect(read.get('c1')).toBe(1);
    expect(read.get('c2')).toBe(0.5);
    expect(read.get('c3')).toBe(0);
    expect(read.get('c4')).toBe(0.3);
  });
});
