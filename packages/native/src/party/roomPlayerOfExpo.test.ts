import { roomPlayerOfExpo } from './roomPlayerOfExpo';
import type { ExpoPlayer } from './roomPlayerOfExpo';

/**
 * An Expo player standing at a moment.
 *
 * @param change - What differs from a paused one ready at a minute in.
 * @returns The player.
 */
const anExpoPlayer = (change: Partial<ExpoPlayer> = {}): ExpoPlayer => ({
  currentTime: 60,
  playing: false,
  playbackRate: 1,
  status: 'readyToPlay',
  bufferedPosition: 75,
  duration: 7200,
  play: jest.fn(),
  pause: jest.fn(),
  ...change,
});

describe('roomPlayerOfExpo', () => {
  it('has reached the end where it has stopped at its duration', () => {
    expect(roomPlayerOfExpo(anExpoPlayer({ currentTime: 7199.9 })).isEnded()).toBe(true);
  });

  it('has not reached the end while it plays, or stopped short of it, or knows no duration', () => {
    expect(roomPlayerOfExpo(anExpoPlayer({ currentTime: 7199.9, playing: true })).isEnded()).toBe(
      false,
    );
    expect(roomPlayerOfExpo(anExpoPlayer({ currentTime: 7000 })).isEnded()).toBe(false);
    expect(roomPlayerOfExpo(anExpoPlayer({ currentTime: 0, duration: 0 })).isEnded()).toBe(false);
  });

  it('reads where it is, how much is buffered ahead and whether it is paused', () => {
    const room = roomPlayerOfExpo(anExpoPlayer());

    expect(room.currentSeconds()).toBe(60);
    expect(room.bufferedAheadSeconds()).toBe(15);
    expect(room.isPaused()).toBe(true);
    expect(room.isSeeking()).toBe(false);
  });

  it('stands its status in for a browser’s ready state', () => {
    expect(roomPlayerOfExpo(anExpoPlayer()).readyState()).toBe(4);
    expect(roomPlayerOfExpo(anExpoPlayer({ status: 'loading' })).readyState()).toBe(1);
    expect(roomPlayerOfExpo(anExpoPlayer({ status: 'idle' })).readyState()).toBe(0);
  });

  it('moves, plays, pauses and changes speed as the party asks', async () => {
    const player = anExpoPlayer();
    const room = roomPlayerOfExpo(player, 0.5);

    room.seekTo(300);
    room.setRate(1.02);
    await room.play();
    room.pause();

    expect(player.currentTime).toBe(300);
    expect(player.playbackRate).toBe(1.02);
    expect(player.play).toHaveBeenCalled();
    expect(player.pause).toHaveBeenCalled();
    expect(room.frameSkewSeconds()).toBe(0.5);
  });

  it('never reports less than nothing buffered', () => {
    expect(roomPlayerOfExpo(anExpoPlayer({ bufferedPosition: 10 })).bufferedAheadSeconds()).toBe(0);
  });
});
