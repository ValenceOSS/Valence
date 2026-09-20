import { describe, expect, it } from 'vitest';
import { separateDestructive } from './separateDestructive';

const item = (id: string, isDestructive = false) => ({
  id,
  label: id,
  isDestructive,
  onChoose: () => {},
});

describe('separateDestructive', () => {
  it('gathers destructive items into a group of their own at the bottom', () => {
    const groups = separateDestructive([
      { items: [item('edit'), item('remove', true), item('copy')] },
      { items: [item('ban', true)] },
    ]);

    expect(groups.map((group) => group.items.map((one) => one.id))).toEqual([
      ['edit', 'copy'],
      ['remove', 'ban'],
    ]);
  });

  it('drops a group that has nothing left in it', () => {
    const groups = separateDestructive([
      { items: [item('remove', true)] },
      { items: [item('edit')] },
    ]);

    expect(groups.map((group) => group.items.map((one) => one.id))).toEqual([['edit'], ['remove']]);
  });

  it('leaves a menu with nothing destructive as it was written', () => {
    const groups = separateDestructive([{ name: 'Do', items: [item('edit')] }]);

    expect(groups).toEqual([{ name: 'Do', items: [expect.objectContaining({ id: 'edit' })] }]);
  });

  it('keeps the names of the groups it leaves', () => {
    const groups = separateDestructive([{ name: 'Do', items: [item('edit'), item('rm', true)] }]);

    expect(groups[0]?.name).toBe('Do');
  });
});
