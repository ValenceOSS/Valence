import { placeOfEpisode } from '@ValenceTv/library/placeOfEpisode';

describe('placeOfEpisode', () => {
  it('writes an episode by its season and number', () => {
    expect(placeOfEpisode({ seasonNumber: 2, episodeNumber: 3, episodeNumberEnd: null })).toBe(
      'S2: E3',
    );
  });

  it('writes a file holding two episodes as both', () => {
    expect(placeOfEpisode({ seasonNumber: 1, episodeNumber: 1, episodeNumberEnd: 2 })).toBe(
      'S1: E1–2',
    );
  });

  it('takes an episode with no season to be in the first', () => {
    expect(placeOfEpisode({ seasonNumber: null, episodeNumber: 4, episodeNumberEnd: null })).toBe(
      'S1: E4',
    );
  });
});
