import { describe, expect, it } from 'vitest';
import { cataloguePicturePath } from './cataloguePicturePath';

describe('cataloguePicturePath', () => {
  it('serves a catalogue picture from this server, keeping its size and file', () => {
    expect(cataloguePicturePath('https://image.tmdb.org/t/p/w780/still.jpg')).toBe(
      '/api/catalogue/pictures/w780/still.jpg',
    );
  });

  it('leaves any other address, or none, as it is', () => {
    expect(cataloguePicturePath('/api/media/1/image/poster')).toBe('/api/media/1/image/poster');
    expect(cataloguePicturePath('https://example.com/w780/still.jpg')).toBe(
      'https://example.com/w780/still.jpg',
    );
    expect(cataloguePicturePath(null)).toBeNull();
  });
});
