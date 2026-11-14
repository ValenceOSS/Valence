import { describe, expect, it } from 'vitest';
import { artworkNameIn } from './artworkNameIn';

describe('artworkNameIn', () => {
  it('reads the name from the end of a picture’s address', () => {
    expect(artworkNameIn('https://cdn.test/api/artwork/0123456789abcdef0123456789abcdef')).toBe(
      '0123456789abcdef0123456789abcdef',
    );
  });

  it('has nothing for no address, or one with no name', () => {
    expect(artworkNameIn(undefined)).toBeUndefined();
    expect(artworkNameIn('https://cdn.test/poster.jpg')).toBeUndefined();
  });
});
