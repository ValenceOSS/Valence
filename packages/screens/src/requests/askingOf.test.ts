import { describe, expect, it } from 'vitest';
import { askingOf } from './askingOf';

describe('askingOf', () => {
  it('names a title by its kind and id', () => {
    expect(askingOf({ kind: 'album', id: 'deezer-7' })).toBe('album:deezer-7');
  });
});
