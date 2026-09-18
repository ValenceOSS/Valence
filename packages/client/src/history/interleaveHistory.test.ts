import { describe, expect, it } from 'vitest';
import { interleaveHistory } from './interleaveHistory';
import type { BookReading } from '@ValenceContracts/schemas/Book';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';

const watched = (id: string, at: string): Viewing => ({
  id,
  mediaItemId: `media-${id}`,
  title: id,
  seriesTitle: null,
  startedAt: at,
  lastWatchedAt: at,
  secondsWatched: 60,
  isFinished: false,
});

const read = (id: string, at: string): BookReading => ({
  book: {
    id,
    libraryId: 'l',
    title: id,
    layout: 'reflow',
    direction: 'leftToRight',
    year: null,
    overview: null,
    genres: null,
    authors: null,
    rating: null,
    hasCover: true,
    chapterCount: 1,
    addedAt: at,
    updatedAt: at,
  },
  chapterId: `chapter-${id}`,
  chapterTitle: id,
  pageNumber: null,
  pageCount: null,
  fraction: 0.5,
  isFinished: false,
  updatedAt: at,
});

const order = (entries: ReturnType<typeof interleaveHistory>) =>
  entries.map((one) => (one.kind === 'viewing' ? one.viewing.id : one.reading.book.id));

describe('interleaveHistory', () => {
  it('puts what was watched and what was read into one list, most recent first', () => {
    expect(
      order(
        interleaveHistory(
          [
            watched('film', '2026-09-18T20:00:00.000Z'),
            watched('episode', '2026-09-16T20:00:00.000Z'),
          ],
          [read('novel', '2026-09-17T20:00:00.000Z')],
          false,
        ),
      ),
    ).toEqual(['film', 'novel', 'episode']);
  });

  it('holds back a book read before the oldest viewing shown while older ones are to come', () => {
    expect(
      order(
        interleaveHistory(
          [watched('film', '2026-09-18T20:00:00.000Z')],
          [read('novel', '2026-09-01T20:00:00.000Z'), read('manga', '2026-09-18T21:00:00.000Z')],
          true,
        ),
      ),
    ).toEqual(['manga', 'film']);
  });

  it('shows every book once there is nothing older to come', () => {
    expect(
      order(
        interleaveHistory(
          [watched('film', '2026-09-18T20:00:00.000Z')],
          [read('novel', '2026-09-01T20:00:00.000Z')],
          false,
        ),
      ),
    ).toEqual(['film', 'novel']);
  });

  it('shows what was read where nothing has been watched', () => {
    expect(order(interleaveHistory([], [read('novel', '2026-09-01T20:00:00.000Z')], true))).toEqual(
      ['novel'],
    );
  });
});
