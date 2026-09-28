import { describe, expect, it } from 'vitest';
import { appleArtworkAt } from './appleArtworkAt';

describe('appleArtworkAt', () => {
  it('asks for the same artwork at the size wanted, square and cropped to fill', () => {
    expect(
      appleArtworkAt('https://is1-ssl.mzstatic.com/image/thumb/Music/ab/cd/100x100bb.jpg', 1200),
    ).toBe('https://is1-ssl.mzstatic.com/image/thumb/Music/ab/cd/1200x1200cc.jpg');
  });

  it('reads a size listed as a picture of any kind', () => {
    expect(appleArtworkAt('https://img/thumb/a/600x600bf.webp', 300)).toBe(
      'https://img/thumb/a/300x300cc.jpg',
    );
  });

  it('leaves an address with no size in it as it is', () => {
    expect(appleArtworkAt('https://img/thumb/a/cover.jpg', 300)).toBe(
      'https://img/thumb/a/cover.jpg',
    );
  });
});
