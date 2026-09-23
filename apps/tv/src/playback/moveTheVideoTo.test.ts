import { moveTheVideoTo } from '@ValenceTv/playback/moveTheVideoTo';

describe('moveTheVideoTo', () => {
  it('tells the player where to play from', () => {
    const player = { currentTime: 0 };

    moveTheVideoTo(player, 42);

    expect(player.currentTime).toBe(42);
  });
});
