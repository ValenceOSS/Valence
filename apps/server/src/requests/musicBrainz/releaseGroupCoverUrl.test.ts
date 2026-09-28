import { describe, expect, it } from 'vitest';
import { releaseGroupCoverUrl } from './releaseGroupCoverUrl';

describe('releaseGroupCoverUrl', () => {
  it('points at this server’s kept cover for the release group', () => {
    expect(releaseGroupCoverUrl('f5093c06-23e3-404f-aeaa-40f72885ee3a')).toBe(
      '/api/music/catalogue/covers/f5093c06-23e3-404f-aeaa-40f72885ee3a',
    );
  });

  it('carries the title and artist to search Apple’s catalogue with', () => {
    expect(
      releaseGroupCoverUrl('f5093c06', {
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
      }),
    ).toBe(
      '/api/music/catalogue/covers/f5093c06?title=The+Dark+Side+of+the+Moon&artist=Pink+Floyd',
    );
  });

  it('leaves the hint off where there is no artist to search with', () => {
    expect(releaseGroupCoverUrl('f5093c06', { title: 'Untitled', artist: null })).toBe(
      '/api/music/catalogue/covers/f5093c06',
    );
  });
});
