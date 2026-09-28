import { describe, expect, it } from 'vitest';
import { artistPictureUrl } from './artistPictureUrl';

describe('artistPictureUrl', () => {
  it('asks this server for the artist’s picture by name', () => {
    expect(artistPictureUrl('Pink Floyd')).toBe(
      '/api/music/catalogue/artists/picture?name=Pink+Floyd',
    );
  });

  it('names the record whose cover stands in where there is one', () => {
    expect(artistPictureUrl('Pink Floyd', 'rg-1')).toBe(
      '/api/music/catalogue/artists/picture?name=Pink+Floyd&cover=rg-1',
    );
  });
});
