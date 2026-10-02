import { describe, expect, it } from 'vitest';
import { spreadPlays } from './spreadPlays';

const LAST = new Date('2026-03-10T00:00:00Z');

describe('spreadPlays', () => {
  it('keeps the last play at its real date and spreads the others back to when the item arrived', () => {
    expect(spreadPlays(3, LAST, new Date('2026-03-01T00:00:00Z'))).toEqual([
      new Date('2026-03-04T00:00:00Z'),
      new Date('2026-03-07T00:00:00Z'),
      LAST,
    ]);
  });

  it('spaces them a day apart where when it arrived is not known, or came after', () => {
    expect(spreadPlays(2, LAST, null)).toEqual([new Date('2026-03-09T00:00:00Z'), LAST]);
    expect(spreadPlays(2, LAST, new Date('2026-04-01T00:00:00Z'))).toEqual([
      new Date('2026-03-09T00:00:00Z'),
      LAST,
    ]);
  });

  it('dates nothing for no plays', () => {
    expect(spreadPlays(0, LAST, null)).toEqual([]);
  });
});
