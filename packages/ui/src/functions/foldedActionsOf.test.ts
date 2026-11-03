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

  it('keeps an action marked as on, and one that cannot be done unavailable', () => {
    const onChoose = vi.fn();
    const [group] = foldedActionsOf([
      { id: 'kept', label: 'Favourite', isChosen: true, onChoose },
      { id: 'cancel', label: 'Cancel', isDisabled: true, onChoose },
      { id: 'share', label: 'Share', onChoose },
    ]);

    expect(group?.items.map((item) => [item.isCurrent, item.isDisabled])).toEqual([
      [true, undefined],
      [undefined, true],
      [undefined, undefined],
    ]);
  });

  it('has nothing to lay out for no actions', () => {
    expect(foldedActionsOf([])).toEqual([]);
  });
});
