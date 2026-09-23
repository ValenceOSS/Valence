import { playTheVideoAt } from '@ValenceTv/playback/playTheVideoAt';

describe('playTheVideoAt', () => {
  it('tells the player how fast to play', () => {
    const player = { playbackRate: 1 };

    playTheVideoAt(player, 1.5);

    expect(player.playbackRate).toBe(1.5);
  });
});
