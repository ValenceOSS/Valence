import { describe, expect, it } from 'vitest';
import { askersOf } from './askersOf';

describe('askersOf', () => {
  it('lists the first asker, then those who joined', () => {
    expect(
      askersOf({
        requestedBy: { id: 'a', name: 'Priya' },
        alsoAskedBy: [{ id: 'b', name: 'Sam' }],
      }),
    ).toEqual([
      { id: 'a', name: 'Priya' },
      { id: 'b', name: 'Sam' },
    ]);
  });
});
