/**
 * A MusicBrainz date as a calendar date: a year alone as its first day, and a month alone as the
 * first of it, since an album known only to have come out in 1979 is out by now either way.
 *
 * @param date - The date as MusicBrainz gives it: `1979`, `1979-11`, `1979-11-30`, or nothing.
 * @returns The day, or null where it gives none.
 */
const calendarDateOf = (date: string): string | null => {
  const [year, month = '01', day = '01'] = date.split('-');

  return year === undefined || !/^\d{4}$/.test(year) ? null : `${year}-${month}-${day}`;
};

export { calendarDateOf };
