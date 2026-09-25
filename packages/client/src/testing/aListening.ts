import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import type { BookListening } from '@ValenceContracts/schemas/Book';

/**
 * Somebody partway through the audiobook, eleven minutes into its twenty.
 *
 * @param overrides - Anything about where they are that matters to the test.
 * @returns Where they are.
 */
const aListening = (overrides: Partial<BookListening> = {}): BookListening => ({
  book: anAudiobook().book,
  chapterId: anAudiobook().chapters[0]?.id ?? '',
  chapterTitle: 'Part 2',
  positionSeconds: 60,
  heardSeconds: 660,
  durationSeconds: 1200,
  isFinished: false,
  updatedAt: '2026-09-23T00:00:00.000Z',
  ...overrides,
});

export { aListening };
