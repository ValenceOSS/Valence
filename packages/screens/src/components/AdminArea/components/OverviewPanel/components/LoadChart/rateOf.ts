import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { say } from '@ValenceI18n/say';

/**
 * A rate written for reading, such as `1.2 MB/s`, or a dash where it is unknown.
 *
 * @param bytesPerSecond - The rate, where it is known.
 * @returns The rate as words.
 */
const rateOf = (bytesPerSecond: number | null | undefined): string =>
  bytesPerSecond === undefined || bytesPerSecond === null
    ? '—'
    : say('screens.adminArea.overviewPanel.perSecond', { size: formatBytes(bytesPerSecond) });

export { rateOf };
