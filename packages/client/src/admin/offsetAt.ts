/**
 * How far a zone is from UTC at a given instant, in milliseconds.
 *
 * Read out of `Intl` rather than from a table, because an offset is a property of the moment as well
 * as the place: the same zone is an hour different in July from January.
 *
 * @param instant - The moment to measure at.
 * @param zone - The IANA zone.
 * @returns The offset in milliseconds, positive east of UTC.
 */
const offsetAt = (instant: Date, zone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const read = (type: string): number => Number(parts.find((part) => part.type === type)?.value);

  return (
    Date.UTC(
      read('year'),
      read('month') - 1,
      read('day'),
      read('hour') % 24,
      read('minute'),
      read('second'),
    ) - instant.getTime()
  );
};

export { offsetAt };
