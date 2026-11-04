import { describe, expect, it } from 'vitest';
import { filterGroupsOf } from './filterGroupsOf';

describe('filterGroupsOf', () => {
  it('names each option by the filter the server reads, with the library’s own values', () => {
    const groups = filterGroupsOf({
      filters: [
        { kind: 'genre', values: [{ value: 'Drama', count: 3 }] },
        { kind: 'codec', values: [{ value: 'hevc', count: 2 }] },
        { kind: 'tag', values: [] },
      ],
    });
    const ids = groups.flatMap((group) => group.options.map((option) => option.id));

    expect(ids).toContain('genre:Drama');
    expect(ids).toContain('missing:poster');
    expect(ids).toContain('year:1990-1999');
    expect(groups.flatMap((group) => group.options).find((one) => one.id === 'codec:hevc')).toEqual(
      {
        id: 'codec:hevc',
        label: 'HEVC',
      },
    );
  });

  it('leaves out a filter the library has no values for', () => {
    const groups = filterGroupsOf({ filters: [{ kind: 'tag', values: [] }] });

    expect(groups.some((group) => group.options.some((one) => one.id.startsWith('tag:')))).toBe(
      false,
    );
  });
});
