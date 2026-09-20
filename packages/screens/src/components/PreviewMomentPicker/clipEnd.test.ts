import { describe, expect, it } from 'vitest';
import { clipEnd } from './clipEnd';

describe('clipEnd', () => {
  it('ends a clip its length after it starts', () => {
    expect(clipEnd(100, 24, 5000)).toBe(124);
  });

  it('stops at the last second of the item rather than running past it', () => {
    expect(clipEnd(4990, 24, 5000)).toBe(5000);
  });
});
