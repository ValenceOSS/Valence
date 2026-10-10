import { describe, expect, it } from 'vitest';
import { askersOf } from './askersOf';

const REQUEST = {
  requestedBy: { id: 'a', name: 'Priya' },
  alsoAskedBy: [{ id: 'b', name: 'Sam' }],
  origin: 'asked' as const,
};

describe('askersOf', () => {
  it('lists the first asker, then those who joined', () => {
    expect(askersOf(REQUEST)).toEqual([
      { id: 'a', name: 'Priya' },
      { id: 'b', name: 'Sam' },
    ]);
  });

  it('lists nobody for a title only followed', () => {
    expect(askersOf({ ...REQUEST, alsoAskedBy: [], origin: 'monitored' })).toEqual([]);
  });
});
