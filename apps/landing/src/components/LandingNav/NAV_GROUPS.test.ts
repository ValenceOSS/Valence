import { describe, expect, it } from 'vitest';
import { NAV_GROUPS } from './NAV_GROUPS';

const WIDE_COLUMNS = 3;

const WIDE_ROWS = 3;

const NARROW_COLUMNS = 2;

const NARROW_ROWS = 4;

describe('NAV_GROUPS', () => {
  it('fits every section in the rows the panel sets aside, so every section is one height', () => {
    for (const group of NAV_GROUPS) {
      expect(group.items.length).toBeLessThanOrEqual(WIDE_COLUMNS * WIDE_ROWS);
      expect(group.items.length).toBeLessThanOrEqual(NARROW_COLUMNS * NARROW_ROWS);
    }
  });

  it('names every place once', () => {
    const labels = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label));

    expect(new Set(labels).size).toBe(labels.length);
  });
});
