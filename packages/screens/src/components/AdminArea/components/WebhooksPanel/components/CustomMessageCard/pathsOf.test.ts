import { describe, expect, it } from 'vitest';
import { pathsOf } from './pathsOf';

describe('pathsOf', () => {
  it('lists every path to a single value, with an example', () => {
    expect(pathsOf({ item: { title: 'A title', year: 2024 }, tags: ['a'] }, 'data')).toEqual([
      { path: 'data.item.title', example: '"A title"' },
      { path: 'data.item.year', example: '2024' },
      { path: 'data.tags', example: '["a"]' },
    ]);
  });

  it('is the path itself for a value that is not an object', () => {
    expect(pathsOf(null, 'data')).toEqual([{ path: 'data', example: 'null' }]);
  });
});
