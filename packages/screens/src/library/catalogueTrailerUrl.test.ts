import { describe, expect, it } from 'vitest';
import { catalogueTrailerUrl } from './catalogueTrailerUrl';

describe('catalogueTrailerUrl', () => {
  it('frames the trailer from the host that does not set cookies', () => {
    expect(catalogueTrailerUrl('dQw4w9WgXcQ')).toContain(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });

  it('asks for nothing to be suggested after it', () => {
    expect(catalogueTrailerUrl('dQw4w9WgXcQ')).toContain('rel=0');
  });

  it('escapes an identifier rather than letting it shape the address', () => {
    expect(catalogueTrailerUrl('a/../b?c=d')).toContain('a%2F..%2Fb%3Fc%3Dd');
  });
});
