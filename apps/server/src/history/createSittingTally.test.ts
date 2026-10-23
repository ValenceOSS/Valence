import { describe, expect, it } from 'vitest';
import { createSittingTally } from './createSittingTally';
import { SAME_VIEWING_MILLISECONDS } from './decideViewing';

const AT = new Date('2026-10-23T20:00:00Z');

describe('createSittingTally', () => {
  it('adds up what is kept for an item', () => {
    const tally = createSittingTally();

    tally.keep('ada:film', AT, 10);

    expect(tally.read('ada:film', AT)).toBe(10);
    expect(tally.read('ada:other', AT)).toBe(0);
  });

  it('forgets a count once the gap that ends a viewing has passed', () => {
    const tally = createSittingTally();

    tally.keep('ada:film', AT, 40);

    expect(tally.read('ada:film', new Date(AT.getTime() + SAME_VIEWING_MILLISECONDS + 1))).toBe(0);
  });

  it('forgets a count when told to', () => {
    const tally = createSittingTally();

    tally.keep('ada:film', AT, 40);
    tally.forget('ada:film');

    expect(tally.read('ada:film', AT)).toBe(0);
  });
});
