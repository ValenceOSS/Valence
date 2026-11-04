import { describe, expect, it } from 'vitest';
import { readJson } from './readJson';

describe('readJson', () => {
  it('reads what JSON says', () => {
    expect(readJson('["a", 1, null]')).toEqual(['a', 1, null]);
    expect(readJson('{"key": true}')).toEqual({ key: true });
  });

  it('answers nothing for what is not JSON', () => {
    expect(readJson('not json')).toBeNull();
    expect(readJson('')).toBeNull();
  });
});
