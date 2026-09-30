import { describe, expect, it } from 'vitest';
import { PAGE_TURN } from './PAGE_TURN';

describe('PAGE_TURN', () => {
  it('holds the numbers the phone reader turns its pages by', () => {
    expect(PAGE_TURN.startsAfter).toBe(12);
    expect(PAGE_TURN.moreAcrossThanDown).toBe(1.5);
    expect(PAGE_TURN.turnsAfter).toBe(40);
    expect(PAGE_TURN.flingPixelsPerMs).toBe(0.3);
    expect(PAGE_TURN.leaves.ms).toBe(110);
    expect(PAGE_TURN.arrives.ms).toBe(200);
  });

  it('leaves slowly and arrives quickly', () => {
    expect(PAGE_TURN.leaves.ease(0.5)).toBeLessThan(0.5);
    expect(PAGE_TURN.arrives.ease(0.5)).toBeGreaterThan(0.5);
  });
});
