import { describe, expect, it } from 'vitest';
import {
  WatchProgressSchema,
  WatchProgressListSchema,
  hasWatchedToTheEnd,
  isWorthResuming,
  isOnContinueWatching,
  watchedFraction,
  STARTED_AFTER_SECONDS,
  FINISHED_PAST_SHARE,
} from './WatchProgress';
import type { MediaSegment } from './MediaSegment';
import type { WatchProgress } from './WatchProgress';

const creditsFrom = (startSeconds: number, endSeconds = 7200): MediaSegment[] => [
  { kind: 'credits', startSeconds, endSeconds, source: 'imported' },
];

const progressOf = (changes: Partial<WatchProgress> = {}): WatchProgress => ({
  mediaId: '0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d',
  positionSeconds: 600,
  durationSeconds: 7200,
  isFinished: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...changes,
});

describe('WatchProgressSchema', () => {
  it('accepts a position somebody has actually reached', () => {
    expect(WatchProgressSchema.safeParse(progressOf()).success).toBe(true);
  });

  it('refuses a position before the beginning', () => {
    expect(WatchProgressSchema.safeParse(progressOf({ positionSeconds: -1 })).success).toBe(false);
  });

  it('refuses an item with no length, which nothing can be a fraction of', () => {
    expect(WatchProgressSchema.safeParse(progressOf({ durationSeconds: 0 })).success).toBe(false);
  });

  it('refuses an identifier that is not one', () => {
    expect(WatchProgressSchema.safeParse(progressOf({ mediaId: 'the-film' })).success).toBe(false);
  });
});

describe('WatchProgressListSchema', () => {
  it('reads a list of positions', () => {
    const parsed = WatchProgressListSchema.safeParse({ progress: [progressOf()] });

    expect(parsed.success).toBe(true);
  });

  it('reads an empty list, which is what a new viewer has', () => {
    expect(WatchProgressListSchema.safeParse({ progress: [] }).success).toBe(true);
  });
});

describe('hasWatchedToTheEnd', () => {
  it('counts something past nine tenths of the way through as watched', () => {
    expect(hasWatchedToTheEnd(7200 * FINISHED_PAST_SHARE, 7200)).toBe(true);
  });

  it('does not count something stopped short of nine tenths', () => {
    expect(hasWatchedToTheEnd(7200 * FINISHED_PAST_SHARE - 1, 7200)).toBe(false);
  });

  it('counts a film with long credits as watched once its credits begin', () => {
    expect(hasWatchedToTheEnd(6000, 7200, creditsFrom(6000))).toBe(true);
    expect(hasWatchedToTheEnd(5999, 7200, creditsFrom(6000))).toBe(false);
  });

  it('counts credits that stop before a scene after them', () => {
    expect(hasWatchedToTheEnd(6000, 7200, creditsFrom(6000, 6900))).toBe(true);
  });

  it('keeps nine tenths where the credits begin later than that', () => {
    expect(hasWatchedToTheEnd(7200 * FINISHED_PAST_SHARE, 7200, creditsFrom(7100))).toBe(true);
  });

  it('ignores credits marked in the first half, which is a marking gone wrong', () => {
    expect(hasWatchedToTheEnd(3000, 7200, creditsFrom(3000))).toBe(false);
  });

  it('ignores an intro, whatever it is marked as', () => {
    expect(
      hasWatchedToTheEnd(6000, 7200, [
        { kind: 'intro', startSeconds: 6000, endSeconds: 6060, source: 'imported' },
      ]),
    ).toBe(false);
  });

  it('never counts the first second, however short the thing claims to be', () => {
    expect(hasWatchedToTheEnd(1, 12)).toBe(false);
    expect(hasWatchedToTheEnd(1, 60)).toBe(false);
  });

  it('asks for nine tenths of something short', () => {
    expect(hasWatchedToTheEnd(107, 120)).toBe(false);
    expect(hasWatchedToTheEnd(108, 120)).toBe(true);
  });

  it('counts nothing with no length as watched', () => {
    expect(hasWatchedToTheEnd(0, 0)).toBe(false);
  });
});

describe('isWorthResuming', () => {
  it('offers to resume something somebody is partway through', () => {
    expect(isWorthResuming(progressOf())).toBe(true);
  });

  it('does not offer to resume something barely started', () => {
    expect(isWorthResuming(progressOf({ positionSeconds: STARTED_AFTER_SECONDS - 1 }))).toBe(false);
  });

  it('does not offer to resume the credits', () => {
    expect(isWorthResuming(progressOf({ positionSeconds: 7200 * FINISHED_PAST_SHARE + 1 }))).toBe(
      false,
    );
  });

  it('does not offer to resume something already finished', () => {
    expect(isWorthResuming(progressOf({ isFinished: true }))).toBe(false);
  });
});

describe('isOnContinueWatching', () => {
  it('offers something partway through', () => {
    expect(isOnContinueWatching(progressOf())).toBe(true);
  });

  it('leaves out something taken off the row', () => {
    expect(isOnContinueWatching(progressOf({ isDismissed: true }))).toBe(false);
  });

  it('leaves out something not worth resuming, whether or not it was taken off', () => {
    expect(isOnContinueWatching(progressOf({ isFinished: true, isDismissed: false }))).toBe(false);
  });
});

describe('watchedFraction', () => {
  it('says how far through something is', () => {
    expect(watchedFraction(progressOf({ positionSeconds: 1800 }))).toBeCloseTo(0.25);
  });

  it('never says more than all of it, however far past the end a position is', () => {
    expect(watchedFraction(progressOf({ positionSeconds: 9000 }))).toBe(1);
  });

  it('reads something finished as all of it, however far it got', () => {
    expect(watchedFraction(progressOf({ positionSeconds: 1800, isFinished: true }))).toBe(1);
  });

  it('says nothing has been watched of something with no length', () => {
    expect(watchedFraction({ ...progressOf(), durationSeconds: 0 })).toBe(0);
  });
});
