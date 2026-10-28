import { describe, expect, it } from 'vitest';
import { addToGroup } from './addToGroup';

describe('addToGroup', () => {
  it('starts a group with its first item and adds the rest in order', () => {
    const groups = new Map<string, number[]>();

    addToGroup(groups, 'odd', 1);
    addToGroup(groups, 'even', 2);
    addToGroup(groups, 'odd', 3);

    expect(groups).toEqual(
      new Map([
        ['odd', [1, 3]],
        ['even', [2]],
      ]),
    );
  });

  it('adds to the group it holds rather than to a copy', () => {
    const groups = new Map<string, number[]>();

    addToGroup(groups, 'all', 1);

    const group = groups.get('all');

    addToGroup(groups, 'all', 2);

    expect(groups.get('all')).toBe(group);
    expect(group).toEqual([1, 2]);
  });
});
