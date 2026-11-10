import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { useRunningPosition } from '@ValenceScreens/admin/useRunningPosition';
import type { SessionProgressProps } from './SessionProgress.types';

/**
 * How far through what it plays a session is, against how long that runs, moving on while it plays.
 *
 * @param session - The session.
 */
const SessionProgress = ({ session }: SessionProgressProps) => {
  const { playback, listening, bookListening } = session;
  const at = playback?.health ?? listening ?? bookListening;
  const running = useRunningPosition(playback);

  return at === null || at.durationSeconds <= 0 ? (
    <span className="text-text-muted">—</span>
  ) : (
    <span className="whitespace-nowrap tabular-nums text-text-muted">
      {formatDuration(running ?? at.positionSeconds)} / {formatDuration(at.durationSeconds)}
    </span>
  );
};

SessionProgress.displayName = 'SessionProgress';

export { SessionProgress };
