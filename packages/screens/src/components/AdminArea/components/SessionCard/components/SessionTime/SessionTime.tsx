import { useEffect, useState } from 'react';
import { TruncatedText } from '@ValenceUI/TruncatedText';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { SessionTimeProps } from './SessionTime.types';
import { say } from '@ValenceI18n/say';

const TICK_MS = 1000;

/**
 * How far a session has got: the time it is at and how long it runs for, that a video's player has
 * not said yet, where it reads a page and how far through the book that is, or, with nothing
 * playing, how long it has been open, counting up.
 *
 * @param session - The session.
 * @param now - The clock, in milliseconds.
 */
const SessionTime = ({ session, now = Date.now }: SessionTimeProps) => {
  const { playback, listening, bookListening, reading } = session;
  const heard = listening ?? bookListening;
  const at = playback?.health ?? heard;
  const isIdle = playback === null && heard === null && reading === null;
  const [clock, setClock] = useState(now);

  useEffect(() => {
    if (!isIdle) {
      return undefined;
    }

    const ticking = setInterval(() => {
      setClock(now());
    }, TICK_MS);

    return () => {
      clearInterval(ticking);
    };
  }, [isIdle, now]);

  const said =
    at !== null
      ? [
          formatDuration(at.positionSeconds),
          at.durationSeconds > 0 ? formatDuration(at.durationSeconds) : null,
        ]
      : playback !== null
        ? [say('screens.adminArea.sessionStatsDialog.notReportedYet')]
        : reading !== null
          ? [
              reading.pageNumber === null
                ? null
                : say('common.pageValue', { value: reading.pageNumber + 1 }),
              reading.fraction === null
                ? null
                : say('common.percent', { value: Math.round(reading.fraction * 100) }),
            ]
          : [formatDuration((clock - session.connectedAt) / 1000)];

  return (
    <TruncatedText
      text={said.filter((part) => part !== null).join(' - ')}
      className="text-[0.8125rem] font-semibold tabular-nums text-text"
    />
  );
};

SessionTime.displayName = 'SessionTime';

export { SessionTime };
