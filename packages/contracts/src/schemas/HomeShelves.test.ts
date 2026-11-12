import { describe, expect, it } from 'vitest';
import { HomeShelvesSchema } from './HomeShelves';

describe('HomeShelvesSchema', () => {
  it('reads a page of shelves and where the next begins', () => {
    expect(
      HomeShelvesSchema.parse({
        shelves: [
          {
            id: 'genre:Drama',
            kind: 'genre',
            genre: 'Drama',
            order: null,
            decade: null,
            page: 0,
            items: [],
          },
        ],
        cursor: 'next',
      }).shelves[0]?.genre,
    ).toBe('Drama');
  });

  it('refuses a shelf of a kind it does not know', () => {
    expect(
      HomeShelvesSchema.safeParse({
        shelves: [
          { id: 'x', kind: 'other', genre: null, order: null, decade: null, page: 0, items: [] },
        ],
        cursor: null,
      }).success,
    ).toBe(false);
  });
});
