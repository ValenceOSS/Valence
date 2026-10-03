import { describe, expect, it } from 'vitest';
import { getTableColumns, SQL } from 'drizzle-orm';
import { series } from '#dialect/Schema';
import { setEverythingFrom } from './setEverythingFrom';

describe('setEverythingFrom', () => {
  it('changes every column but the key to what was just written', () => {
    const set = setEverythingFrom(series, ['id']);
    const columns = Object.keys(getTableColumns(series));

    expect(Object.keys(set).sort()).toEqual(columns.filter((name) => name !== 'id').sort());
    expect(Object.values(set).every((value) => value instanceof SQL)).toBe(true);
  });

  it('leaves every column of the key as it is', () => {
    expect(Object.keys(setEverythingFrom(series, ['id', 'libraryId']))).not.toContain('libraryId');
  });
});
