import { describe, expect, it } from 'vitest';
import {
  BookCommandSchema,
  NowReadingSchema,
  ReportNowListeningSchema,
  ReportNowReadingSchema,
} from './BookRemote';

const BOOK_ID = '00000000-0000-4000-8000-000000000001';

describe('BookRemote', () => {
  it('reads what a device says it is listening to', () => {
    const report = {
      clientId: 'tab-1',
      nowListening: {
        bookId: BOOK_ID,
        chapterId: '00000000-0000-4000-8000-000000000002',
        positionSeconds: 600,
        durationSeconds: 3600,
        isPlaying: true,
        reportedAtMs: 1,
      },
    };

    expect(ReportNowListeningSchema.parse(report)).toEqual(report);
    expect(ReportNowListeningSchema.parse({ clientId: 'tab-1', nowListening: null })).toEqual({
      clientId: 'tab-1',
      nowListening: null,
    });
  });

  it('reads a place in a book as a fraction or a page, and refuses one past the end', () => {
    expect(
      ReportNowReadingSchema.parse({
        clientId: 'tab-1',
        nowReading: { bookId: BOOK_ID, fraction: null, pageNumber: 12, reportedAtMs: 1 },
      }).nowReading?.pageNumber,
    ).toBe(12);
    expect(
      NowReadingSchema.safeParse({
        bookId: BOOK_ID,
        fraction: 1.5,
        pageNumber: null,
        reportedAtMs: 1,
      }).success,
    ).toBe(false);
  });

  it('knows pausing, resuming and stopping, and nothing else', () => {
    expect(BookCommandSchema.parse('pause')).toBe('pause');
    expect(BookCommandSchema.safeParse('skip').success).toBe(false);
  });
});
