import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

const DAYS_FROM_CINEMAS_TO_HOME = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The day a requested film is held until before it is searched for: its release at home in the way
 * the admin chose, digital or on disc; the other of the two where the catalogue does not know that
 * one; or three months after cinemas where it knows neither. A series is never held as a whole —
 * each episode waits for its own air date.
 *
 * @param request - The request.
 * @returns The day, or null where there is nothing to wait for.
 */
const releaseDateOf = ({
  kind,
  waitFor,
  releaseDates,
}: Pick<MediaRequestRecord, 'kind' | 'waitFor' | 'releaseDates'>): string | null => {
  if (kind === 'series') {
    return null;
  }

  const other = waitFor === 'digital' ? releaseDates.physical : releaseDates.digital;
  const afterCinemas =
    releaseDates.theatrical === null
      ? null
      : new Date(Date.parse(releaseDates.theatrical) + DAYS_FROM_CINEMAS_TO_HOME * DAY_MS)
          .toISOString()
          .slice(0, 10);

  return releaseDates[waitFor] ?? other ?? afterCinemas;
};

export { releaseDateOf };
