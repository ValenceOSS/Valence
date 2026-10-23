import type { EpisodePath } from './EpisodePath.types';

/**
 * The day an episode named by its air date aired, written as the catalogue writes it.
 *
 * @param read - What the episode's path says.
 * @returns The day as `YYYY-MM-DD`, or null where the path does not name one.
 */
const airDateOf = (read: EpisodePath): string | null =>
  !read.isByDate || read.year === null || read.month === null || read.day === null
    ? null
    : [
        String(read.year).padStart(4, '0'),
        String(read.month).padStart(2, '0'),
        String(read.day).padStart(2, '0'),
      ].join('-');

export { airDateOf };
