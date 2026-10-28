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

  it('groups fifty thousand items under one key in no time', () => {
    const groups = new Map<string, number[]>();
    const started = performance.now();

    for (let at = 0; at < 50_000; at += 1) {
      addToGroup(groups, 'all', at);
    }

    expect(groups.get('all')).toHaveLength(50_000);
    expect(performance.now() - started).toBeLessThan(250);
  });
});
