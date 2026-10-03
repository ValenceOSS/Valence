import type { ResourceSampleRange } from '@ValenceContracts/schemas/ResourceSample';

/**
 * When one of the server's readings was taken, as precisely as the range it is shown in calls for:
 * to the second over the last minute, to the minute over a day, and with the weekday over several.
 *
 * @param atMs - When the reading was taken.
 * @param range - The range the chart shows, or the last minute held in memory.
 * @param locale - Whose language, the viewer's own unless given.
 * @returns The moment, written for reading.
 */
const describeReadingTime = (
  atMs: number,
  range: ResourceSampleRange | 'minute',
  locale?: string,
): string =>
  new Intl.DateTimeFormat(locale, {
    ...(range === '3d' || range === '7d' ? { weekday: 'short' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    ...(range === 'minute' ? { second: '2-digit' } : {}),
  }).format(new Date(atMs));

export { describeReadingTime };
