import { describe, expect, it } from 'vitest';
import { isJellyfinVideoView } from './isJellyfinVideoView';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('isJellyfinVideoView', () => {
  it('shows films and programmes, and leaves out the rest', () => {
    expect(isJellyfinVideoView(aJellyfinFilm({ CollectionType: 'movies' }))).toBe(true);
    expect(isJellyfinVideoView(aJellyfinFilm({ CollectionType: 'tvshows' }))).toBe(true);
    expect(isJellyfinVideoView(aJellyfinFilm({ CollectionType: 'music' }))).toBe(false);
  });
});
