import { describe, expect, it } from 'vitest';
import { STEP, positionBetween } from './positionBetween';

describe('positionBetween', () => {
  it('starts an empty playlist a step in', () => {
    expect(positionBetween(null, null)).toBe(STEP);
  });

  it('puts an entry halfway between its new neighbours', () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });

  it('puts an entry a step past the last one', () => {
    expect(positionBetween(2048, null)).toBe(2048 + STEP);
  });

  it('puts an entry a step before the first one', () => {
    expect(positionBetween(null, 1024)).toBe(0);
  });

  it('says there is no room where the gap is too narrow to split', () => {
    expect(positionBetween(1, 1 + 1e-9)).toBeNull();
  });

  it('keeps finding room for a long run of moves into the same gap', () => {
    let after = 2048;

    for (let move = 0; move < 30; move += 1) {
      after = positionBetween(1024, after) ?? Number.NaN;
    }

    expect(Number.isFinite(after)).toBe(true);
    expect(after).toBeGreaterThan(1024);
  });
});
