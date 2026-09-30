import { describe, expect, it } from 'vitest';
import { artworkTagOf } from './artworkTagOf';

describe('artworkTagOf', () => {
  it('names the same picture the same way every time', () => {
    expect(artworkTagOf('https://image.tmdb.org/t/p/original/a.png')).toBe(
      artworkTagOf('https://image.tmdb.org/t/p/original/a.png'),
    );
  });

  it('names a different picture differently', () => {
    expect(artworkTagOf('https://image.tmdb.org/t/p/original/a.png')).not.toBe(
      artworkTagOf('https://image.tmdb.org/t/p/original/b.png'),
    );
  });

  it('is quoted, as an entity tag is', () => {
    expect(artworkTagOf('x')).toMatch(/^"[\w-]{22}"$/);
  });
});
