import { describe, expect, it } from 'vitest';
import { missingCoverUrl } from './missingCoverUrl';

describe('missingCoverUrl', () => {
  it('asks for the release’s own cover where the song names its release, falling back on its name', () => {
    expect(
      missingCoverUrl({
        releaseId: '959621bf-6536-4f37-a60d-148168d98700',
        title: 'Isles',
        artist: 'Bicep & Friends',
      }),
    ).toBe(
      '/api/music/catalogue/release-covers/959621bf-6536-4f37-a60d-148168d98700?title=Isles&artist=Bicep+%26+Friends',
    );
  });

  it('asks for a record of that name by that artist where the release is not known', () => {
    expect(missingCoverUrl({ releaseId: null, title: 'Isles', artist: 'Bicep' })).toBe(
      '/api/music/catalogue/named-covers?title=Isles&artist=Bicep',
    );
  });
});
