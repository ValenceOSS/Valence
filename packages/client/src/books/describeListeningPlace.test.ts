import { describe, expect, it } from 'vitest';
import { describeListeningPlace } from '@ValenceClient/books/describeListeningPlace';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import type { BookListening } from '@ValenceContracts/schemas/Book';

/**
 * Somebody partway through the book.
 *
 * @param heardSeconds - How much of it they have heard.
 * @returns Where they are.
 */
const heard = (heardSeconds: number): BookListening => ({
  book: anAudiobook().book,
  chapterId: anAudiobook().chapters[0]?.id ?? '',
  chapterTitle: 'Part 1',
  positionSeconds: 0,
  heardSeconds,
  durationSeconds: 3 * 3600,
  isFinished: false,
  updatedAt: '2026-09-23T00:00:00.000Z',
});

describe('describeListeningPlace', () => {
  it('says the chapter and how long is left, in hours and minutes', () => {
    expect(describeListeningPlace(heard(3600 + 20 * 60))).toBe('Part 1 · 1 h 40 min left');
  });

  it('says whole hours, and minutes alone, the short way', () => {
    expect(describeListeningPlace(heard(3600))).toBe('Part 1 · 2 h left');
    expect(describeListeningPlace(heard(3 * 3600 - 5 * 60))).toBe('Part 1 · 5 min left');
  });

  it('never says nothing is left of a book not finished', () => {
    expect(describeListeningPlace(heard(3 * 3600))).toBe('Part 1 · 1 min left');
  });
});
