import { useTicking } from '@ValenceScreens/clock/useTicking';
import { whereItHasGot } from '@ValenceClient/video/whereItHasGot';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

const TICK_MS = 1000;

const MOVES_ON_FOR_AT_MOST_MS = 60_000;

/**
 * How far through a film a session is now, moved on each second from what its player last said
 * while it plays, so a device that says so only every half a minute still reads as moving. It stops
 * a minute past the last thing it heard, so a player that has gone quiet is not shown running on.
 *
 * @param playback - What the session is watching.
 * @returns How far through it is, in seconds, or nothing before its player has said.
 */
const useRunningPosition = (playback: ActiveSession['playback']): number | null => {
  const health = playback?.health ?? null;
  const reportedAtMs = health?.reportedAtMs;
  const isMoving = playback?.isPlaying === true && reportedAtMs !== undefined;
  const now = useTicking(TICK_MS, isMoving);

  if (playback === null || health === null) {
    return null;
  }

  return reportedAtMs === undefined
    ? health.positionSeconds
    : whereItHasGot(
        {
          positionSeconds: health.positionSeconds,
          durationSeconds: health.durationSeconds,
          isPlaying: playback.isPlaying,
          reportedAtMs,
        },
        Math.min(now, reportedAtMs + MOVES_ON_FOR_AT_MOST_MS),
      );
};

export { useRunningPosition };
