import { describe, expect, it } from 'vitest';
import { sweepWindows } from './sweepWindows';

describe('sweepWindows', () => {
  it('forgets keys with nothing left in the window, and keeps the rest', () => {
    const kept = new Map([
      ['old', [0, 10]],
      ['recent', [0, 950]],
    ]);

    sweepWindows(kept, 100, 1000);

    expect([...kept.keys()]).toEqual(['recent']);
  });
});
