import { describe, expect, it, vi } from 'vitest';
import { filterMenuGroupOf } from './filterMenuGroupOf';

describe('filterMenuGroupOf', () => {
  it('lets a kind that allows one answer choose any, keeping the other kinds’ choices', () => {
    const onChange = vi.fn();
    const group = filterMenuGroupOf(
      { name: 'Decade', options: [{ id: 'decade:1990', label: '1990s' }], isSingle: true },
      new Set(['decade:1990', 'genre:Drama']),
      onChange,
    );

    expect(group).toMatchObject({ name: 'Decade', selectedId: 'decade:1990' });

    if ('onSelect' in group) {
      group.onSelect('');
    }

    expect(onChange).toHaveBeenCalledWith(new Set(['genre:Drama']));
  });

  it('lets a kind that allows several tick and untick each', () => {
    const onChange = vi.fn();
    const group = filterMenuGroupOf(
      { name: 'Genre', options: [{ id: 'genre:Drama', label: 'Drama' }] },
      new Set(),
      onChange,
    );

    if ('onToggle' in group) {
      group.onToggle('genre:Drama', true);
    }

    expect(onChange).toHaveBeenCalledWith(new Set(['genre:Drama']));
  });
});
