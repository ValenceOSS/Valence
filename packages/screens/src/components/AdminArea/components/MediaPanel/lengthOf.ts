import type { MediaTitle } from './MediaTitle.types';

/**
 * How long a row runs: every episode of a series or season together, or for anything else its main
 * file's length, however many versions of it are held.
 *
 * @param title - The row.
 * @returns Its length in seconds.
 */
const lengthOf = (title: MediaTitle): number =>
  title.kind === 'series' || title.kind === 'season'
    ? title.episodes.reduce((sum, file) => sum + file.durationSeconds, 0)
    : title.lead.durationSeconds;

export { lengthOf };
