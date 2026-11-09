import type { sendPresenceHeartbeat } from '@ValenceClient/playback/startPlaybackSession';

type PresenceHealth = NonNullable<Parameters<typeof sendPresenceHeartbeat>[2]>;

type MeasuredPlayer = {
  readonly currentTime: number;
  readonly duration: number;
  readonly bufferedPosition: number;
  readonly videoTrack: {
    readonly size: { readonly width: number; readonly height: number };
  } | null;
};

/**
 * A figure the server will take: a finite number no lower than nothing, since anything else would
 * have the whole heartbeat refused.
 *
 * @param value - What the player said.
 * @returns The figure, or nothing where the player has none yet.
 */
const aFigure = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0);

/**
 * Measures the stream a phone or a television is playing, for the heartbeat that fills the position,
 * the buffer and the picture size an operator watches on the sessions page.
 *
 * @param player - The client's Expo player.
 * @param knownSeconds - How long the title runs, where the server has said, which a converted stream
 *   that is still being made cannot say for itself.
 * @returns What the heartbeat carries.
 */
const presenceHealthOfExpo = (player: MeasuredPlayer, knownSeconds: number): PresenceHealth => {
  const positionSeconds = aFigure(player.currentTime);
  const size = player.videoTrack?.size;

  return {
    positionSeconds,
    durationSeconds: knownSeconds > 0 ? knownSeconds : aFigure(player.duration),
    bufferedAheadSeconds: aFigure(player.bufferedPosition - positionSeconds),
    presentedWidth: Math.round(aFigure(size?.width ?? 0)),
    presentedHeight: Math.round(aFigure(size?.height ?? 0)),
  };
};

export type { PresenceHealth };

export { presenceHealthOfExpo };
