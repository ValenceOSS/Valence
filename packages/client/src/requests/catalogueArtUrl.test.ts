import { describe, expect, it } from 'vitest';
import { catalogueArtUrl } from './catalogueArtUrl';

describe('catalogueArtUrl', () => {
  it('takes the picture the library holds', () => {
    expect(
      catalogueArtUrl({ kind: 'film', art: { kind: 'media', id: 'm1' }, posterUrl: null }),
    ).toBe('/api/media/m1/image/poster?size=small');
    expect(
      catalogueArtUrl({ kind: 'series', art: { kind: 'media', id: 'e1' }, posterUrl: null }),
    ).toBe('/api/media/e1/image/poster?of=title&size=small');
    expect(
      catalogueArtUrl({ kind: 'album', art: { kind: 'album', id: 'a' }, posterUrl: null }),
    ).toBe('/api/music/albums/a/artwork');
    expect(
      catalogueArtUrl({ kind: 'artist', art: { kind: 'artist', id: 'b' }, posterUrl: null }),
    ).toBe('/api/music/artists/b/image');
    expect(catalogueArtUrl({ kind: 'book', art: { kind: 'book', id: 'c' }, posterUrl: null })).toBe(
      '/api/books/c/cover',
    );
  });

  it('takes the catalogue’s poster for a title not held, or nothing', () => {
    expect(catalogueArtUrl({ kind: 'film', art: null, posterUrl: 'https://img/p.jpg' })).toBe(
      'https://img/p.jpg',
    );
    expect(catalogueArtUrl({ kind: 'film', art: null, posterUrl: null })).toBeNull();
  });
});
