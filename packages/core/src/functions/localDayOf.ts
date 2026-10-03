/**
 * The day an instant falls on where the viewer is, as YYYY-MM-DD.
 *
 * Read from the device's own clock and time zone rather than from UTC, so that just after midnight
 * here is today here and not still yesterday in Greenwich.
 *
 * @param instant - The moment, now by default.
 * @returns The day.
 */
const localDayOf = (instant: Date = new Date()): string =>
  [
    instant.getFullYear().toString().padStart(4, '0'),
    (instant.getMonth() + 1).toString().padStart(2, '0'),
    instant.getDate().toString().padStart(2, '0'),
  ].join('-');

export { localDayOf };
