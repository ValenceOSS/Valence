import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

/**
 * How far through a film another device is now, from what it last said: moved on by the time since
 * it said so while it is playing, and never past the end.
 *
 * @param watching - What the device last said.
 * @param now - The time now, in milliseconds.
 * @returns How far through it is, in seconds.
 */
const whereItHasGot = (watching: VideoNowWatching, now: number): number => {
  const moved = watching.isPlaying ? Math.max(now - watching.reportedAtMs, 0) / 1000 : 0;
  const at = watching.positionSeconds + moved;

  return watching.durationSeconds > 0 ? Math.min(at, watching.durationSeconds) : at;
};

export { whereItHasGot };
