import { describe, expect, it } from 'vitest';
import { findOutOfOrderMigrations } from './findOutOfOrderMigrations';

describe('findOutOfOrderMigrations', () => {
  it('finds nothing in a journal whose stamps only rise', () => {
    expect(
      findOutOfOrderMigrations([
        { tag: '0001_a', when: 100 },
        { tag: '0002_b', when: 200 },
      ]),
    ).toEqual([]);
  });

  it('finds a migration stamped below one listed before it', () => {
    expect(
      findOutOfOrderMigrations([
        { tag: '0001_a', when: 100 },
        { tag: '0002_b', when: 300 },
        { tag: '0003_c', when: 200 },
      ]),
    ).toEqual(['0003_c']);
  });

  it('finds one stamped the same as the one before, which drizzle would skip too', () => {
    expect(
      findOutOfOrderMigrations([
        { tag: '0001_a', when: 100 },
        { tag: '0002_b', when: 100 },
      ]),
    ).toEqual(['0002_b']);
  });

  it('judges each against the newest before it, not only the one before', () => {
    expect(
      findOutOfOrderMigrations([
        { tag: '0001_a', when: 500 },
        { tag: '0002_b', when: 100 },
        { tag: '0003_c', when: 200 },
      ]),
    ).toEqual(['0002_b', '0003_c']);
  });

  it('leaves out the ones that were already out of order and cannot be restamped', () => {
    expect(
      findOutOfOrderMigrations(
        [
          { tag: '0001_a', when: 500 },
          { tag: '0002_b', when: 100 },
          { tag: '0003_c', when: 200 },
        ],
        ['0002_b'],
      ),
    ).toEqual(['0003_c']);
  });
});
