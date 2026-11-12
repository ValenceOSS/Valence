import { describe, expect, it } from 'vitest';
import { artworkNameOf } from './artworkNameOf';

describe('artworkNameOf', () => {
  it('names a picture by thirty-two hexadecimal characters, the same each time', () => {
    const name = artworkNameOf('secret', 'https://image.tmdb.org/t/p/w780/a.jpg');

    expect(name).toMatch(/^[0-9a-f]{32}$/);
    expect(artworkNameOf('secret', 'https://image.tmdb.org/t/p/w780/a.jpg')).toBe(name);
  });

  it('names the same picture differently on a server with another secret', () => {
    expect(artworkNameOf('one', 'https://example.com/a.jpg')).not.toBe(
      artworkNameOf('two', 'https://example.com/a.jpg'),
    );
  });
});
