import { describe, expect, it } from 'vitest';
import { lowerKeysOf } from './lowerKeysOf';

describe('lowerKeysOf', () => {
  it('lowers every name and joins a name sent twice', () => {
    expect(lowerKeysOf({ ParentId: ['a'], fields: ['x', 'y'] })).toEqual({
      parentid: 'a',
      fields: 'x,y',
    });
  });
});
