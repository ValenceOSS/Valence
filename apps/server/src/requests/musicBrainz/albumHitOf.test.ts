import { describe, expect, it } from 'vitest';
import { albumHitOf } from './albumHitOf';

describe('albumHitOf', () => {
  it('describes a release group as an album to ask for', () => {
    expect(
      albumHitOf({
        id: 'fa402a46-b4b1-40d6-8d3b-b051550eb687',
        title: 'Isles',
        'primary-type': 'Album',
        'secondary-types': [],
        'first-release-date': '2021-01-22',
        disambiguation: '',
        'artist-credit': [{ name: 'Bicep', joinphrase: '' }],
      }),
    ).toEqual({
      kind: 'album',
      musicBrainzId: 'fa402a46-b4b1-40d6-8d3b-b051550eb687',
      title: 'Isles',
      artist: 'Bicep',
      disambiguation: null,
      type: 'album',
      year: 2021,
      coverUrl:
        '/api/music/catalogue/covers/fa402a46-b4b1-40d6-8d3b-b051550eb687?title=Isles&artist=Bicep',
    });
  });
});
