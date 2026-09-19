import { describe, expect, it } from 'vitest';
import { releaseGroupCoverUrl } from './releaseGroupCoverUrl';

describe('releaseGroupCoverUrl', () => {
  it('points at the release group’s small front cover', () => {
    expect(releaseGroupCoverUrl('f5093c06-23e3-404f-aeaa-40f72885ee3a')).toBe(
      'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250',
    );
  });
});
