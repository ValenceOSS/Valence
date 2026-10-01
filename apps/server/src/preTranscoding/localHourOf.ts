/**
 * The hour of the day a moment falls in, on the clock of a time zone.
 *
 * @param moment - The moment.
 * @param timezone - The zone's name, such as Europe/London.
 * @returns The hour, nought to twenty-three.
 */
const localHourOf = (moment: Date, timezone: string): number => {
  const hour = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: timezone,
  })
    .formatToParts(moment)
    .find((part) => part.type === 'hour')?.value;

  return Number(hour ?? '0') % 24;
};

export { localHourOf };
