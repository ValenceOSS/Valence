/**
 * Writes a moment the way an English email says it, with the time zone named, since the reader may
 * be somewhere other than the server.
 *
 * @param at - The moment.
 * @param timeZone - The zone to say it in, the server's own when not given.
 * @returns The date and time in words.
 */
const formatEmailDate = (at: Date, timeZone?: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...(timeZone === undefined ? {} : { timeZone }),
  }).format(at);

export { formatEmailDate };
