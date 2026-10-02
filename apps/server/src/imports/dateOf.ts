const EARLIEST = Date.UTC(1971, 0, 1);

/**
 * Reads a date a source wrote, as ISO text or as epoch seconds, treating the placeholders sources
 * write for "never" as nothing.
 *
 * @param value - The date as written.
 * @returns The date, or null where there is none.
 */
const dateOf = (value: string | number | null | undefined): Date | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);

  return Number.isNaN(date.getTime()) || date.getTime() < EARLIEST ? null : date;
};

export { dateOf };
