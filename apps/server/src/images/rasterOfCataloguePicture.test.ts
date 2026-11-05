import { describe, expect, it } from 'vitest';
import { rasterOfCataloguePicture } from './rasterOfCataloguePicture';

describe('rasterOfCataloguePicture', () => {
  it('fetches a catalogue drawing as the PNG the catalogue serves beside it', () => {
    expect(rasterOfCataloguePicture('https://image.tmdb.org/t/p/original/logo.svg')).toBe(
      'https://image.tmdb.org/t/p/original/logo.png',
    );
    expect(rasterOfCataloguePicture('https://image.tmdb.org/t/p/w500/logo.SVG')).toBe(
      'https://image.tmdb.org/t/p/w500/logo.png',
    );
  });

  it('leaves the catalogue’s other pictures as they are', () => {
    expect(rasterOfCataloguePicture('https://image.tmdb.org/t/p/original/logo.png')).toBe(
      'https://image.tmdb.org/t/p/original/logo.png',
    );
    expect(rasterOfCataloguePicture('https://image.tmdb.org/t/p/w500/poster.jpg')).toBe(
      'https://image.tmdb.org/t/p/w500/poster.jpg',
    );
  });

  it('leaves a drawing from anywhere else as it is', () => {
    expect(rasterOfCataloguePicture('https://example.com/logo.svg')).toBe(
      'https://example.com/logo.svg',
    );
  });
});
