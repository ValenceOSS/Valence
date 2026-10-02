import type { RoomPlayer } from '@ValenceClient/party/RoomPlayer';

type ExpoPlayer = {
  currentTime: number;
  playing: boolean;
  playbackRate: number;
  readonly status: string;
  readonly bufferedPosition: number;
  play: () => void;
  pause: () => void;
};

const READY = 4;

const LOADING = 1;

/**
 * Lets a watch party drive the player a phone or a television plays a stream in, through the few
 * things the party asks of any player. Expo's player has no ready state of the browser's kind, so
 * its status stands in: ready to play as able to play now, loading as knowing where it is but not
 * yet able to play. It never reports a seek in progress, since it moves at once.
 *
 * @param player - The client's Expo player.
 * @param frameSkewSeconds - How far the frame on screen sits from the playback clock, where known.
 * @returns The player as the party drives it.
 */
const roomPlayerOfExpo = (player: ExpoPlayer, frameSkewSeconds = 0): RoomPlayer => ({
  readyState: () =>
    player.status === 'readyToPlay' ? READY : player.status === 'loading' ? LOADING : 0,
  currentSeconds: () => player.currentTime,
  frameSkewSeconds: () => frameSkewSeconds,
  bufferedAheadSeconds: () => Math.max(0, player.bufferedPosition - player.currentTime),
  isPaused: () => !player.playing,
  isSeeking: () => false,
  seekTo: (seconds) => {
    player.currentTime = seconds;
  },
  play: () => {
    player.play();

    return Promise.resolve();
  },
  pause: () => {
    player.pause();
  },
  setRate: (rate) => {
    player.playbackRate = rate;
  },
});

export type { ExpoPlayer };

export { roomPlayerOfExpo };
