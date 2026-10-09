import { describe, expect, it } from 'vitest';
import { isIncompleteAlbum } from './isIncompleteAlbum';

describe('isIncompleteAlbum', () => {
  it('calls an album short only once it is filed with fewer tracks than its longest edition', () => {
    expect(isIncompleteAlbum({ trackCount: 14, filedTrackCount: 12 })).toBe(true);
    expect(isIncompleteAlbum({ trackCount: 14, filedTrackCount: 14 })).toBe(false);
    expect(isIncompleteAlbum({ trackCount: 14, filedTrackCount: null })).toBe(false);
    expect(isIncompleteAlbum({ trackCount: null, filedTrackCount: 3 })).toBe(false);
    expect(isIncompleteAlbum({})).toBe(false);
  });
});
