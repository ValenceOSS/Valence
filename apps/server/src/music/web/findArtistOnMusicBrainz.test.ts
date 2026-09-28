import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findArtistOnMusicBrainz } from './findArtistOnMusicBrainz';

const PINK_FLOYD = '83d91898-7763-47d7-b03b-b92132375c47';

describe('findArtistOnMusicBrainz', () => {
  it('takes the match whose name is the one asked for and that MusicBrainz is sure of', async () => {
    const web = aWebThatAnswers({
      'musicbrainz.org/ws/2/artist/': {
        artists: [
          { id: '00000000-0000-4000-8000-000000000001', name: 'Pink Floyd Sound', score: 100 },
          { id: PINK_FLOYD, name: 'Pink Floyd', score: 98 },
        ],
      },
    });

    expect(await findArtistOnMusicBrainz(web, 'pink floyd')).toBe(PINK_FLOYD);
  });

  it('takes nothing where MusicBrainz is not sure enough', async () => {
    const web = aWebThatAnswers({
      'musicbrainz.org/ws/2/artist/': {
        artists: [{ id: PINK_FLOYD, name: 'Pink Floyd', score: 40 }],
      },
    });

    expect(await findArtistOnMusicBrainz(web, 'Pink Floyd')).toBeNull();
  });

  it('takes nothing where MusicBrainz does not answer', async () => {
    expect(await findArtistOnMusicBrainz(aWebThatAnswers({}), 'Pink Floyd')).toBeNull();
  });
});
