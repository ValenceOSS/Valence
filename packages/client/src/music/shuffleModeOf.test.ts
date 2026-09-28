import { describe, expect, it } from 'vitest';
import { shuffleModeOf } from './shuffleModeOf';
import type { PlayQueue } from './playQueue';

const aQueue = (isShuffled: boolean, isSmart: boolean): PlayQueue => ({
  tracks: [],
  order: [],
  at: 0,
  isShuffled,
  isSmart,
  picks: [],
  repeat: 'off',
  isOrdered: false,
  source: null,
});

describe('shuffleModeOf', () => {
  it('is off with nothing queued', () => {
    expect(shuffleModeOf(null)).toBe('off');
  });

  it('is off for a queue played in order', () => {
    expect(shuffleModeOf(aQueue(false, false))).toBe('off');
  });

  it('is on for a shuffled queue', () => {
    expect(shuffleModeOf(aQueue(true, false))).toBe('on');
  });

  it('is smart for a queue shuffled with picks mixed in', () => {
    expect(shuffleModeOf(aQueue(true, true))).toBe('smart');
  });
});
