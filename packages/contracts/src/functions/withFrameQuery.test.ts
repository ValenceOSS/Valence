import { describe, expect, it } from 'vitest';
import { withFrameQuery } from './withFrameQuery';

describe('withFrameQuery', () => {
  it('carries where the picture sits', () => {
    expect(withFrameQuery('/api/playlists/p1/artwork', { zoom: 1.5, x: -0.25, y: 1 })).toBe(
      '/api/playlists/p1/artwork?zoom=1.5&x=-0.25&y=1',
    );
    expect(withFrameQuery('/api/a?b=1', { zoom: 1, x: 0, y: 0 })).toBe('/api/a?b=1&zoom=1&x=0&y=0');
  });

  it('sends a picture left alone to the address as it is', () => {
    expect(withFrameQuery('/api/playlists/p1/artwork', null)).toBe('/api/playlists/p1/artwork');
  });
});
