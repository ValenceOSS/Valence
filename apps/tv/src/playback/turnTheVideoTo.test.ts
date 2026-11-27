import { turnTheVideoTo } from '@ValenceTv/playback/turnTheVideoTo';

describe('turnTheVideoTo', () => {
  it('tells the player how loud to play', () => {
    const player = { volume: 1 };

    turnTheVideoTo(player, 0.4);

    expect(player.volume).toBe(0.4);
  });
});
