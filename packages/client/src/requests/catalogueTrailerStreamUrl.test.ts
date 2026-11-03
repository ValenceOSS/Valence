import { describe, expect, it } from 'vitest';
import { catalogueTrailerStreamUrl } from './catalogueTrailerStreamUrl';

describe('catalogueTrailerStreamUrl', () => {
  it('names the stream of a film or series trailer by its catalogue id', () => {
    expect(catalogueTrailerStreamUrl('film', '1234')).toBe(
      '/api/requests/catalogue/title/film/1234/trailer.m3u8',
    );
  });
});
