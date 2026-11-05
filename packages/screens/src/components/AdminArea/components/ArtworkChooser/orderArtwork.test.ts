import { describe, expect, it } from 'vitest';
import { orderArtwork } from './orderArtwork';

const option = (url: string, votes: number, width: number, language: string | null) => ({
  url,
  previewUrl: url,
  language,
  width,
  height: width,
  votes,
});

const OPTIONS = [
  option('https://p.test/a', 1, 1000, 'en'),
  option('https://p.test/b', 9, 500, null),
  option('https://p.test/c', 4, 2000, 'fr'),
];

const urlsOf = (order: Parameters<typeof orderArtwork>[1]) =>
  orderArtwork(OPTIONS, order).map(({ option: one }) => one.url.slice(-1));

describe('orderArtwork', () => {
  it('keeps the catalogue’s order, with each picture’s rank in it', () => {
    expect(urlsOf('catalogue')).toEqual(['a', 'b', 'c']);
    expect(orderArtwork(OPTIONS, 'votes').map(({ rank }) => rank)).toEqual([2, 3, 1]);
  });

  it('puts the most votes, or the most pixels, first', () => {
    expect(urlsOf('votes')).toEqual(['b', 'c', 'a']);
    expect(urlsOf('largest')).toEqual(['c', 'a', 'b']);
  });

  it('puts pictures with no lettering first, the rest as the catalogue ranks them', () => {
    expect(urlsOf('bare')).toEqual(['b', 'a', 'c']);
  });
});
