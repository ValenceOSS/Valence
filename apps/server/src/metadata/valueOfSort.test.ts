import { describe, expect, it } from 'vitest';
import { aListedFile } from '@ValenceServer/testing/aListedFile';
import { listedTitlesOf } from './listedTitlesOf';
import { valueOfSort } from './valueOfSort';

const NOTHING = { duplicates: new Map(), duplicatePaths: new Map(), editedKeys: new Set<string>() };

describe('valueOfSort', () => {
  it('puts a title in order by what each sort reads of it', () => {
    const [title] = listedTitlesOf(
      [aListedFile('heat', { sizeBytes: 42, summary: { title: 'The Heat', year: 1995 } })],
      NOTHING,
    );

    if (title === undefined) {
      throw new Error('no title');
    }

    expect(valueOfSort(title, 'title')).toBe('heat');
    expect(valueOfSort(title, 'year')).toBe(1995);
    expect(valueOfSort(title, 'size')).toBe(42);
    expect(valueOfSort(title, 'quality')).toBe(1080);
    expect(valueOfSort(title, 'codec')).toBe('h264');
    expect(valueOfSort(title, 'length')).toBe(6000);
    expect(valueOfSort(title, 'added')).toBe('2026-01-01T00:00:00.000Z');
  });
});
