import { describe, expect, it } from 'vitest';
import { firstWholeGroups } from './firstWholeGroups';

describe('firstWholeGroups', () => {
  it('takes whole groups up to the limit, leaving out a group that would not fit', () => {
    const duplicated = new Map([
      ['a1', 'film:1'],
      ['a2', 'film:1'],
      ['b1', 'film:2'],
      ['b2', 'film:2'],
      ['c1', 'film:3'],
      ['c2', 'film:3'],
    ]);

    expect(firstWholeGroups(duplicated, 5)).toEqual(['a1', 'a2', 'b1', 'b2']);
  });

  it('takes everything where it all fits', () => {
    expect(
      firstWholeGroups(
        new Map([
          ['a1', 'g'],
          ['a2', 'g'],
        ]),
        100,
      ),
    ).toEqual(['a1', 'a2']);
  });
});
