import { calendarDateOf } from '@ValenceServer/requests/musicBrainz/calendarDateOf';

/**
 * The year a MusicBrainz date falls in.
 *
 * @param date - The date, however much of it MusicBrainz gives.
 * @returns The year, or null where it gives none.
 */
const yearOfDate = (date: string | null): number | null => {
  const day = date === null ? null : calendarDateOf(date);

  return day === null ? null : Number(day.slice(0, 4));
};

export { yearOfDate };
