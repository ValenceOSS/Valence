import { describe, expect, it } from 'vitest';
import { titleOfMusicHit } from './titleOfMusicHit';

describe('titleOfMusicHit', () => {
  it('shows an album under its artist, and an artist under what tells them apart', () => {
    const album = {
      kind: 'album' as const,
      musicBrainzId: 'fa402a46-b4b1-40d6-8d3b-b051550eb687',
      title: 'Isles',
      artist: 'Bicep',
      disambiguation: null,
      type: 'album' as const,
      year: 2021,
      coverUrl: '/cover',
    };

    expect(titleOfMusicHit(album)).toEqual({
      kind: 'album',
      id: 'fa402a46-b4b1-40d6-8d3b-b051550eb687',
      title: 'Isles',
      subtitle: 'Bicep',
      year: 2021,
      overview: null,
      posterUrl: '/cover',
    });
    expect(
      titleOfMusicHit({ ...album, kind: 'artist', artist: null, disambiguation: 'UK duo' })
        .subtitle,
    ).toBe('UK duo');
  });
});
