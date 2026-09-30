import { describe, expect, it } from 'vitest';
import { artworkRevisions } from './artworkRevisions';

describe('artworkRevisions', () => {
  it('counts nothing for an item whose artwork was never changed', () => {
    expect(artworkRevisions.of('untouched')).toBe(0);
  });

  it('counts each change, item by item', () => {
    artworkRevisions.bump(['a', 'b']);
    artworkRevisions.bump(['a']);

    expect(artworkRevisions.of('a')).toBe(2);
    expect(artworkRevisions.of('b')).toBe(1);
  });
});
