import { describe, expect, it } from 'vitest';
import { describeCalendarFilters } from './describeCalendarFilters';

describe('describeCalendarFilters', () => {
  it('offers films or shows, and the library or requests, as single choices', () => {
    const groups = describeCalendarFilters(false);

    expect(groups.map((group) => group.options.map((option) => option.id))).toEqual([
      ['kind:films', 'kind:shows'],
      ['from:library', 'from:requests'],
    ]);
    expect(groups.every((group) => group.isSingle === true)).toBe(true);
  });

  it('offers everybody’s requests only to somebody who may see them', () => {
    expect(describeCalendarFilters(true).at(-1)?.options).toEqual([
      { id: 'who:everyone', label: 'Everyone' },
    ]);
  });
});
