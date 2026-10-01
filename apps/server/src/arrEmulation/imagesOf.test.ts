import { describe, expect, it } from 'vitest';
import { imagesOf } from './imagesOf';

describe('imagesOf', () => {
  it('names the poster as both the address and the remote address', () => {
    expect(imagesOf('https://image.tmdb.org/p.jpg')).toEqual([
      {
        coverType: 'poster',
        url: 'https://image.tmdb.org/p.jpg',
        remoteUrl: 'https://image.tmdb.org/p.jpg',
      },
    ]);
  });

  it('has no pictures without a poster', () => {
    expect(imagesOf(null)).toEqual([]);
  });
});
