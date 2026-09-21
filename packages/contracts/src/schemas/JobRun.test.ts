import { describe, expect, it } from 'vitest';
import { JobKindStatsSchema, JobRunQuerySchema, JobStatsSchema } from './JobRun';

describe('JobRunQuerySchema ordering and paging', () => {
  it('starts at the newest and the first page, with no end to the time asked for', () => {
    expect(JobRunQuerySchema.parse({})).toMatchObject({ sort: 'newest', offset: 0, untilMs: null });
  });

  it.each(['newest', 'oldest', 'longest'])('takes the order %s', (sort) => {
    expect(JobRunQuerySchema.parse({ sort }).sort).toBe(sort);
  });

  it('refuses an order it does not know, and a page before the first', () => {
    expect(JobRunQuerySchema.safeParse({ sort: 'shortest' }).success).toBe(false);
    expect(JobRunQuerySchema.safeParse({ offset: -5 }).success).toBe(false);
  });
});

describe('JobKindStatsSchema', () => {
  const STATS = {
    kind: 'library.scan',
    runs: 4,
    completed: 3,
    failed: 1,
    running: 0,
    medianMs: 900,
    slowestMs: 2000,
    lastAtMs: 50,
  };

  it('reads how a kind of job has gone', () => {
    expect(JobKindStatsSchema.parse(STATS)).toStrictEqual(STATS);
  });

  it('has no times for a kind that has not finished a run', () => {
    expect(
      JobKindStatsSchema.parse({ ...STATS, medianMs: null, slowestMs: null, lastAtMs: null }),
    ).toMatchObject({ medianMs: null, slowestMs: null, lastAtMs: null });
  });

  it('refuses a count that is negative', () => {
    expect(JobKindStatsSchema.safeParse({ ...STATS, failed: -1 }).success).toBe(false);
  });

  it('reads a summary of every kind since a moment', () => {
    expect(JobStatsSchema.parse({ sinceMs: 10, kinds: [STATS] }).kinds).toHaveLength(1);
  });
});
