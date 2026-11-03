import { describe, expect, it, vi } from 'vitest';
import { foldedActionsOf } from './foldedActionsOf';

describe('foldedActionsOf', () => {
  it('runs plain actions together and gives an action with choices a group of its own', () => {
    const onChoose = vi.fn();
    const groups = foldedActionsOf([
      { id: 'share', label: 'Share', onChoose },
      { id: 'hide', label: 'Hide', onChoose },
      {
        id: 'download',
        label: 'Download',
        onChoose,
        choices: [{ id: 'season', label: 'This season', onChoose }],
      },
      { id: 'collect', label: 'Add to a collection', onChoose },
    ]);

    expect(groups.map((group) => group.name)).toEqual([undefined, 'Download', undefined]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['share', 'hide']);
    expect(groups[1]?.items.map((item) => item.id)).toEqual(['season']);
    expect(groups[2]?.items.map((item) => item.id)).toEqual(['collect']);
  });

  it('has nothing to lay out for no actions', () => {
    expect(foldedActionsOf([])).toEqual([]);
  });
});
