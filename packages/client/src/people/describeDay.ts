/**
 * Writes a date the way somebody says it rather than the way a catalogue stores it, as the day it
 * names wherever it is read, and leaves an unreadable one out rather than showing the raw string
 * back.
 *
 * @param day - The date as the catalogue gave it.
 * @returns The date in words, or null where there is none or it could not be read.
 */
const describeDay = (day: string | null | undefined): string | null => {
  if (day === null || day === undefined) {
    return null;
  }

  const at = Date.parse(day);

  return Number.isNaN(at)
    ? null
    : new Date(at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
};

export { describeDay };
