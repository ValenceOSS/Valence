import { describe, expect, it } from 'vitest';
import { logLineAsText } from './logLineAsText';
import type { LogRecord } from '@ValenceContracts/schemas/Log';

const aRecord = (over?: Partial<LogRecord>): LogRecord => ({
  id: 'one',
  atMs: Date.UTC(2026, 8, 21, 12, 30, 5),
  level: 'error',
  source: 'scanner',
  message: 'Could not read /films/a.mkv',
  detail: null,
  count: 1,
  context: {
    jobId: null,
    jobKind: null,
    libraryId: null,
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
  ...over,
});

describe('logLineAsText', () => {
  it('says when, how serious, where from and what', () => {
    expect(logLineAsText(aRecord())).toBe(
      '2026-09-21T12:30:05.000Z ERROR scanner: Could not read /films/a.mkv',
    );
  });

  it('says how many times a repeat happened', () => {
    expect(logLineAsText(aRecord({ count: 40 }))).toContain('[x40]');
  });

  it('lists the identifiers the record carries, and only those', () => {
    const line = logLineAsText(
      aRecord({
        context: {
          jobId: 'job-1',
          jobKind: 'library.scan',
          libraryId: null,
          mediaId: null,
          sessionId: null,
          requestId: null,
        },
      }),
    );

    expect(line).toContain('(jobId=job-1 jobKind=library.scan)');
    expect(line).not.toContain('libraryId');
  });

  it('indents the detail beneath the line', () => {
    expect(logLineAsText(aRecord({ detail: 'first\nsecond' }))).toContain(
      '\n    first\n    second',
    );
  });
});
