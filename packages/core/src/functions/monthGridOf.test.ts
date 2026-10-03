import { describe, expect, it } from 'vitest';
import { monthGridOf } from './monthGridOf';

describe('monthGridOf', () => {
  it('draws six whole weeks from the Monday on or before the first', () => {
    const grid = monthGridOf('2026-10-17');

    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-09-28');
    expect(grid[3]).toBe('2026-10-01');
    expect(grid.at(-1)).toBe('2026-11-08');
  });
});
