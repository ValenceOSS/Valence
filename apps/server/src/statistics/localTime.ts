type LocalTime = {
  day: string;
  weekday: number;
  hour: number;
};

const WEEKDAYS: Readonly<Record<string, number>> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/**
 * Builds a reader of where a moment falls on the clock somewhere: its calendar day, its day of the
 * week counted from Monday, and its hour. A zone this server does not know reads as UTC.
 *
 * @param zone - The IANA time zone, such as `Europe/London`.
 * @returns What turns a moment into its local day, weekday and hour.
 */
const localTime = (zone: string): ((at: Date) => LocalTime) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  } as const;
  let format: Intl.DateTimeFormat;

  try {
    format = new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone });
  } catch {
    format = new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' });
  }

  return (at) => {
    const parts = Object.fromEntries(
      format.formatToParts(at).map((part) => [part.type, part.value]),
    );

    return {
      day: `${parts.year ?? ''}-${parts.month ?? ''}-${parts.day ?? ''}`,
      weekday: WEEKDAYS[parts.weekday ?? ''] ?? 0,
      hour: Number(parts.hour ?? 0) % 24,
    };
  };
};

export type { LocalTime };

export { localTime };
