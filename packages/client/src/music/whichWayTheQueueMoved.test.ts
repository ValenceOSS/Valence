import { describe, expect, it } from 'vitest';
import { whichWayTheQueueMoved } from './whichWayTheQueueMoved';

describe('whichWayTheQueueMoved', () => {
  it('goes on to a later track and back to an earlier one', () => {
    expect(whichWayTheQueueMoved(2, 3, 10)).toBe(1);
    expect(whichWayTheQueueMoved(2, 7, 10)).toBe(1);
    expect(whichWayTheQueueMoved(3, 2, 10)).toBe(-1);
  });

  it('goes on when repeating runs off the end back to the start', () => {
    expect(whichWayTheQueueMoved(9, 0, 10)).toBe(1);
  });

  it('goes back when going back from the start wraps round to the end', () => {
    expect(whichWayTheQueueMoved(0, 9, 10)).toBe(-1);
  });

  it('reads a queue of two plainly, since there is no telling which way it wrapped', () => {
    expect(whichWayTheQueueMoved(1, 0, 2)).toBe(-1);
  });
});
