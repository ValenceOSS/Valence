import { LIKED_SONGS } from '@ValenceTv/music/LIKED_SONGS';

describe('LIKED_SONGS', () => {
  it('is a tile that opens the songs this viewer has liked', () => {
    expect(LIKED_SONGS).toEqual({
      kind: 'liked',
      id: 'liked',
      title: 'Liked Songs',
      detail: 'All your liked songs',
      art: null,
      view: { kind: 'liked' },
    });
  });
});
